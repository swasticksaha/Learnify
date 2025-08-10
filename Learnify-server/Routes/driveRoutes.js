const express = require('express');
const fs = require('fs');
const multer = require('multer');
const { google } = require('googleapis');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = process.env.REDIRECT_URI;

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

router.get('/connect', (req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive'],
    prompt: 'consent'
  });

  res.redirect(authUrl);
});

router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  try {
    const { tokens } = await oauth2Client.getToken(code);
    req.session.googleToken = tokens;

    // ✅ Don't redirect — just send a basic response
    res.send('<script>window.close();</script>');
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.send('<script>window.close();</script>');
  }
});

const isGoogleConnected = (req, res, next) => {
  if (!req.session.googleToken) {
    return res.status(401).json({ error: 'Google Drive not connected' });
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  oauth2Client.setCredentials(req.session.googleToken);
  req.drive = google.drive({ version: 'v3', auth: oauth2Client });
  next();
};

router.get('/dashboard-data', isGoogleConnected, (req, res) => {
  req.drive.files.list({
    q: "sharedWithMe = true and trashed=false",
    pageSize: 100,
    fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink)',
    orderBy: 'folder,name'
  }, (err, response) => {
    if (err) return res.status(500).json({ error: 'Failed to list files' });
    
    const files = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : null,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink, 
      thumbnailLink: file.thumbnailLink,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      isShared: true
    }));
    
    res.json({ files });
  });
});

router.get('/combined-root', isGoogleConnected, async (req, res) => {
  try {
    const [sharedRes, myDriveRes] = await Promise.all([
      req.drive.files.list({
        q: "sharedWithMe = true and trashed=false",
        pageSize: 50,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink)',
        orderBy: 'folder,name'
      }),
      req.drive.files.list({
        q: "'root' in parents and trashed=false",
        pageSize: 50,
        fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink)',
        orderBy: 'folder,name'
      })
    ]);

    const combine = (items,isShared) => items.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : null,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      isShared: isShared
    }));

    res.json({
      files: [...combine(sharedRes.data.files,true), 
              ...combine(myDriveRes.data.files,false)]
    });
  } catch (error) {
    console.error('Combined fetch error:', error);
    res.status(500).json({ error: 'Failed to load combined drive data' });
  }
});

router.get('/folder/:folderId', isGoogleConnected, async (req, res) => {
  try {
    const { folderId } = req.params;

    const response = await req.drive.files.list({
      q: `'${folderId}' in parents and trashed=false`,
      fields: 'files(id, name, mimeType, size, createdTime, modifiedTime, webViewLink, thumbnailLink, owners)',
      orderBy: 'folder,name',
      pageSize: 100
    });

    const files = response.data.files.map(file => ({
      id: file.id,
      name: file.name,
      mimeType: file.mimeType,
      size: file.size ? parseInt(file.size) : null,
      createdTime: file.createdTime,
      modifiedTime: file.modifiedTime,
      webViewLink: file.webViewLink,
      thumbnailLink: file.thumbnailLink,
      isFolder: file.mimeType === 'application/vnd.google-apps.folder',
      isShared: file.owners?.[0]?.me === false // ✅ if not owned by current user
    }));

    res.json({
      success: true,
      files,
      folderId
    });

  } catch (error) {
    console.error('Error fetching folder contents:', error);
    res.status(500).json({ error: 'Failed to fetch folder contents' });
  }
});

router.get('/folder-info/:folderId', isGoogleConnected, async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Special case for root folder
    if (folderId === 'root') {
      return res.json({
        success: true,
        folder: {
          id: 'root',
          name: 'My Drive',
          parents: []
        }
      });
    }

    // Get folder information
    const response = await req.drive.files.get({
      fileId: folderId,
      fields: 'id, name, parents'
    });

    res.json({
      success: true,
      folder: {
        id: response.data.id,
        name: response.data.name,
        parents: response.data.parents || []
      }
    });

  } catch (error) {
    console.error('Error fetching folder info:', error);
    res.status(500).json({ error: 'Failed to fetch folder information' });
  }
});

router.get('/breadcrumb/:folderId', isGoogleConnected, async (req, res) => {
  try {
    const { folderId } = req.params;
    
    // Start with root for any folder
    const breadcrumb = [{ id: 'root', name: 'My Drive' }];
    
    // If it's root folder, return just that
    if (folderId === 'root') {
      return res.json({
        success: true,
        breadcrumb: breadcrumb
      });
    }

    // Build breadcrumb by traversing up the folder hierarchy
    let currentFolderId = folderId;
    const folderPath = [];

    while (currentFolderId && currentFolderId !== 'root') {
      try {
        const response = await req.drive.files.get({
          fileId: currentFolderId,
          fields: 'id, name, parents'
        });

        folderPath.unshift({
          id: response.data.id,
          name: response.data.name
        });

        // Move to parent folder
        currentFolderId = response.data.parents && response.data.parents[0];
      } catch (error) {
        console.error('Error in breadcrumb traversal:', error);
        break;
      }
    }

    // Combine root with folder path
    const fullBreadcrumb = [...breadcrumb, ...folderPath];

    res.json({
      success: true,
      breadcrumb: fullBreadcrumb
    });

  } catch (error) {
    console.error('Error building breadcrumb:', error);
    res.status(500).json({ error: 'Failed to build breadcrumb' });
  }
});

// router.post('/upload', isGoogleConnected, upload.single('file'), (req, res) => {
//   const fileMetadata = { name: req.file.originalname };
//   const media = { body: fs.createReadStream(req.file.path) };

//   req.drive.files.create({
//     resource: fileMetadata,
//     media,
//     fields: 'id'
//   }, (err, file) => {
//     fs.unlink(req.file.path, () => {});
//     if (err) return res.status(500).json({ error: 'Upload failed' });
//     res.json({ message: 'Upload successful', id: file.data.id });
//   });
// });

router.post('/upload/:folderId', isGoogleConnected, upload.single('file'), (req, res) => {
  const { folderId } = req.params;
  const fileMetadata = { 
    name: req.file.originalname,
    parents: [folderId] // Upload to specific folder
  };
  const media = { body: fs.createReadStream(req.file.path) };

  req.drive.files.create({
    resource: fileMetadata,
    media,
    fields: 'id'
  }, (err, file) => {
    fs.unlink(req.file.path, () => {});
    if (err) return res.status(500).json({ error: 'Upload failed' });
    res.json({ message: 'Upload successful', id: file.data.id });
  });
});

router.get('/download/:fileId', isGoogleConnected, (req, res) => {
  const fileId = req.params.fileId;

  req.drive.files.get({ fileId, fields: 'name' }, (err, meta) => {
    if (err) return res.status(500).send('Failed to fetch file metadata');
    const fileName = meta.data.name;

    req.drive.files.get({ fileId, alt: 'media' }, { responseType: 'stream' }, (err, fileRes) => {
      if (err) return res.status(500).send('Failed to download file');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      fileRes.data.pipe(res);
    });
  });
});

router.post('/delete/:fileId', isGoogleConnected, (req, res) => {
  req.drive.files.delete({ fileId: req.params.fileId }, (err) => {
    if (err) return res.status(500).json({ error: 'Failed to delete file' });
    res.json({ message: 'File deleted' });
  });
});

router.get('/status', (req, res) => {
  if (req.session.googleToken) {
    res.json({ connected: true });
  } else {
    res.json({ connected: false });
  }
});

router.post('/disconnect', (req, res) => {
  req.session.googleToken = null;
  res.json({ message: 'Google Drive disconnected' });
});

router.get('/preview/:fileId', isGoogleConnected, async (req, res) => {
  const fileId = req.params.fileId;
  
  try {
    // Get file metadata
    const fileMetadata = await req.drive.files.get({
      fileId,
      fields: 'mimeType, name'
    });
    
    const { mimeType, name } = fileMetadata.data;
    
    // For Google Workspace files, redirect to Google's preview
    if (mimeType.includes('google-apps')) {
      return res.redirect(`https://drive.google.com/file/d/${fileId}/preview`);
    }
    
    // Stream the actual file content
    const response = await req.drive.files.get({
      fileId,
      alt: 'media'
    }, { responseType: 'stream' });
    
    res.setHeader('Content-Type', mimeType);
    response.data.pipe(res);
    
  } catch (error) {
    console.error('Preview error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
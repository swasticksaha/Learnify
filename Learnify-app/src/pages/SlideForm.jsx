import React, { useState, useEffect } from 'react';
import { FaGoogle, FaGithub, FaLinkedinIn, FaEye, FaEyeSlash } from 'react-icons/fa';
import styles from "../styles/SlideForm.module.css";
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const SlideForm = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Field-specific errors
  const [fieldErrors, setFieldErrors] = useState({
    login: {
      email: '',
      password: ''
    },
    signup: {
      email: '',
      password: '',
      confirmPassword: '',
    }
  });
  
  // Form states
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: ''
  });
  
  const [signupForm, setSignupForm] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    // Check for OAuth error in URL params
    const error = searchParams.get('error');
    if (error) {
      switch (error) {
        case 'google_auth_failed':
          setError('Google authentication failed. Please try again.');
          break;
        case 'github_auth_failed':
          setError('GitHub authentication failed. Please try again.');
          break;
        case 'linkedin_auth_failed':
          setError('LinkedIn authentication failed. Please try again.');
          break;
        default:
          setError('Authentication failed. Please try again.');
      }
    }
  }, [searchParams]);

  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    return password.length >= 6;
  };

  const validateUsername = (username) => {
    return username.length >= 3;
  };

  // Clear field errors
  const clearFieldErrors = () => {
    setFieldErrors({
      login: { email: '', password: '' },
      signup: { username: '', email: '', password: '' }
    });
  };

  const handleSignUpClick = () => {
    setIsRightPanelActive(true);
    setError('');
    setSuccess('');
    clearFieldErrors();
  };

  const handleSignInClick = () => {
    setIsRightPanelActive(false);
    setError('');
    setSuccess('');
    clearFieldErrors();
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    // Clear previous field errors
    const newFieldErrors = { login: { email: '', password: '' }, signup: { ...fieldErrors.signup } };
    
    // Validate fields
    let hasErrors = false;
    
    if (!loginForm.email) {
      newFieldErrors.login.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(loginForm.email)) {
      newFieldErrors.login.email = 'Please enter a valid email address';
      hasErrors = true;
    }
    
    if (!loginForm.password) {
      newFieldErrors.login.password = 'Password is required';
      hasErrors = true;
    }
    
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/login', loginForm, {
        withCredentials: true,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = response.data;

      if (response.status === 200) {
        setSuccess('Login successful! Redirecting...');
        clearFieldErrors();
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1500);
      } else {
        // Handle specific login errors based on your backend responses
        if (data.message === "Invalid credentials") {
          // Your backend returns "Invalid credentials" for both wrong email and password
          newFieldErrors.login.email = 'Invalid email or password';
          newFieldErrors.login.password = 'Invalid email or password';
        } else if (data.message && data.message.includes('social login')) {
          // Handle social login account error
          newFieldErrors.login.email = 'Please use social login for this account';
          setError(data.message);
        } else {
          setError(data.message || 'Login failed');
        }
        setFieldErrors(newFieldErrors);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Network error. Please try again.');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Clear previous field errors
    const newFieldErrors = { login: { ...fieldErrors.login }, signup: { email: '', password: '', confirmPassword: '' } };
    
    // Validate fields
    let hasErrors = false;
    
    if (!signupForm.email) {
      newFieldErrors.signup.email = 'Email is required';
      hasErrors = true;
    } else if (!validateEmail(signupForm.email)) {
      newFieldErrors.signup.email = 'Please enter a valid email';
      hasErrors = true;
    }

    if (!signupForm.password) {
      newFieldErrors.signup.password = 'Password is required';
      hasErrors = true;
    } else if (!validatePassword(signupForm.password)) {
      newFieldErrors.signup.password = 'Password must be at least 6 characters';
      hasErrors = true;
    }

    if (!signupForm.confirmPassword) {
      newFieldErrors.signup.confirmPassword = 'Please re-enter password';
      hasErrors = true;
    } else if (signupForm.password !== signupForm.confirmPassword) {
      newFieldErrors.signup.confirmPassword = 'Passwords do not match';
      hasErrors = true;
    }

    
    if (hasErrors) {
      setFieldErrors(newFieldErrors);
      setLoading(false);
      return;
    }

    try {
      const response = await axios.post('http://localhost:5000/api/register', {
          email: signupForm.email,
          password: signupForm.password,
          confirmPassword: signupForm.confirmPassword,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const data = response.data;

      if (response.status === 200) {
        setSuccess('Account created successfully! Redirecting to setup...');
        setSignupForm({ email: '', password: '', confirmPassword: '' });
        clearFieldErrors();
        setTimeout(() => {
          navigate('/setup');
        }, 2000);
      } else {
        // Handle specific signup errors based on your backend responses
        if (data.message === "User already exists with this email") {
          newFieldErrors.signup.email = 'This email is already registered';
        } else if (data.message && data.message.toLowerCase().includes('email')) {
          newFieldErrors.signup.email = data.message;
        } else if (data.message && data.message.toLowerCase().includes('username')) {
          newFieldErrors.signup.username = data.message;
        } else {
          setError(data.message || 'Registration failed');
        }
        setFieldErrors(newFieldErrors);
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Signup error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginInputChange = (e) => {
    setLoginForm({
      ...loginForm,
      [e.target.name]: e.target.value
    });
    
    // Clear field error when user starts typing
    if (fieldErrors.login[e.target.name]) {
      setFieldErrors({
        ...fieldErrors,
        login: {
          ...fieldErrors.login,
          [e.target.name]: ''
        }
      });
    }
  };

  const handleSignupInputChange = (e) => {
    setSignupForm({
      ...signupForm,
      [e.target.name]: e.target.value
    });

    // Clear error when typing
    if (fieldErrors.signup[e.target.name]) {
      setFieldErrors({
        ...fieldErrors,
        signup: {
          ...fieldErrors.signup,
          [e.target.name]: ''
        }
      });
    }
  };


  return (
    <div className={styles['slideform-wrapper']}>
      <div className={`${styles.container} ${isRightPanelActive ? styles['right-panel-active'] : ''}`} id="container">
        {/* Sign Up Form */}
        <div className={`${styles['form-container']} ${styles['sign-up-container']}`}>
          <form className={styles.form} onSubmit={handleSignupSubmit} autoComplete="off">
            <h1 className={styles['slideform-h1']}>Create Account</h1>
            <span className={styles['slideform-span']}>Sign up using social networks</span>
            <div className={styles['social-container']}>
              <a href="http://localhost:5000/auth/google" className={styles.social}><FaGoogle /></a>
              <a href="http://localhost:5000/auth/github" className={styles.social}><FaGithub /></a>
              <a href="http://localhost:5000/auth/linkedin" className={styles.social}><FaLinkedinIn /></a>
            </div>
            <div className={styles.ruler}><span>OR</span></div>
            
            <div className={styles['input-group']}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={signupForm.email}
                onChange={handleSignupInputChange}
                className={`${styles.input} ${fieldErrors.signup.email ? styles['input-error'] : ''}`}
                disabled={loading}
                autoComplete="off"
              />
              {fieldErrors.signup.email && (
                <span className={styles['error-text']}>{fieldErrors.signup.email}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <div className={styles['password-wrapper']}>
                <input
                  type={showSignupPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  value={signupForm.password}
                  onChange={handleSignupInputChange}
                  className={`${styles.input} ${fieldErrors.signup.password ? styles['input-error'] : ''}`}
                  disabled={loading}
                  autoComplete="off"
                />
                <span onClick={() => setShowSignupPassword(prev => !prev)} className={styles['eye-icon']}>
                  {showSignupPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {fieldErrors.signup.password && (
                <span className={styles['error-text']}>{fieldErrors.signup.password}</span>
              )}
            </div>

            <div className={styles['input-group']}>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={signupForm.confirmPassword}
                onChange={handleSignupInputChange}
                className={`${styles.input} ${fieldErrors.signup.confirmPassword ? styles['input-error'] : ''}`}
                disabled={loading}
                autoComplete="off"
              />
              {fieldErrors.signup.confirmPassword && (
                <span className={styles['error-text']}>{fieldErrors.signup.confirmPassword}</span>
              )}
            </div>
            
            <button 
              type="submit" 
              className={styles['slideform-button']}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Sign In Form */}
        <div className={`${styles['form-container']} ${styles['sign-in-container']}`}>
          <form className={styles.form} onSubmit={handleLoginSubmit} autoComplete="off">
            <h1 className={styles['slideform-h1']}>Login to Your Account</h1>
            <span className={styles['slideform-span']}>Login using social networks</span>
            <div className={styles['social-container']}>
              <a href="http://localhost:5000/auth/google" className={styles.social}><FaGoogle /></a>
              <a href="http://localhost:5000/auth/github" className={styles.social}><FaGithub /></a>
              <a href="http://localhost:5000/auth/linkedin" className={styles.social}><FaLinkedinIn /></a>
            </div>
            <div className={styles.ruler}><span>OR</span></div>
            
            <div className={styles['input-group']}>
              <input 
                type="email" 
                name="email"
                placeholder="Email" 
                className={`${styles.input} ${fieldErrors.login.email ? styles['input-error'] : ''}`}
                value={loginForm.email}
                onChange={handleLoginInputChange}
                disabled={loading}
                autoComplete="off"
              />
              {fieldErrors.login.email && (
                <span className={styles['error-text']}>{fieldErrors.login.email}</span>
              )}
            </div>
            
            <div className={styles['input-group']}>
              <div className={styles['password-wrapper']}>
                <input
                  type={showLoginPassword ? "text" : "password"}
                  name="password"
                  placeholder="Password"
                  className={`${styles.input} ${fieldErrors.login.password ? styles['input-error'] : ''}`}
                  value={loginForm.password}
                  onChange={handleLoginInputChange}
                  disabled={loading}
                  autoComplete="off"
                />
                <span 
                  onClick={() => setShowLoginPassword(prev => !prev)}
                  className={styles['eye-icon']}
                >
                  {showLoginPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
              {fieldErrors.login.password && (
                <span className={styles['error-text']}>{fieldErrors.login.password}</span>
              )}
            </div>
            
            <button 
              type="submit" 
              className={styles['slideform-button']}
              disabled={loading}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Overlay Container */}
        <div className={styles['overlay-container']}>
          <div className={styles.overlay}>
            <div className={`${styles['overlay-panel']} ${styles['overlay-left']}`}>
              <h1 className={styles['slideform-ghost-h1']}>Welcome Back!</h1>
              <p className={styles['slideform-p']}>To keep connected with us please login with your personal info</p>
              <button className={`${styles.ghost} ${styles['slideform-button']}`} onClick={handleSignInClick}>
                Sign In
              </button>
            </div>
            <div className={`${styles['overlay-panel']} ${styles['overlay-right']}`}>
              <h1 className={styles['slideform-ghost-h1']}>Hello, Friend!</h1>
              <p className={styles['slideform-p']}>Enter your personal details and start your journey with us</p>
              <button className={`${styles.ghost} ${styles['slideform-button']}`} onClick={handleSignUpClick}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Global Error/Success Messages */}
      {error && <div className={styles['global-error']}>{error}</div>}
      {success && <div className={styles['global-success']}>{success}</div>}
    </div>
  );
};

export default SlideForm;

// components/JoinRequestToast.jsx

const JoinRequestToast = ({ request, onApprove, onReject }) => {
  return (
    <div className="bg-white shadow-lg rounded-lg border border-gray-200 px-4 py-3 mb-3 animate-slide-in-right w-[280px] transform transition-all duration-500 ease-out translate-x-0 opacity-100"
    style={{ animation: "slideFadeIn 0.4s ease-out" }}
    >
      <p className="text-sm font-medium text-gray-800 mb-2">
        <span className="font-bold">{request.userName}</span> wants to join
      </p>
      <div className="flex justify-end gap-2">
        <button
          onClick={() => onReject(request.socketId)}
          className="text-sm px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600"
        >
          Reject
        </button>
        <button
          onClick={() => onApprove(request.socketId)}
          className="text-sm px-3 py-1 rounded bg-green-500 text-white hover:bg-green-600"
        >
          Accept
        </button>
      </div>
    </div>
  );
};

export default JoinRequestToast;

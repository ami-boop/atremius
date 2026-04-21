export default function UserNotRegisteredError() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-slate-900">User not registered</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Your account authenticated successfully, but it does not have access to this app yet.
        </p>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/'
          }}
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-slate-700"
        >
          Return home
        </button>
      </div>
    </div>
  )
}

import { useState, type ReactElement, type FormEvent } from "react";
import { authenticatedPost } from "../utils/api";
import { AUTH_API } from "../config/backend";

interface CreateUserResponse {
  message: string;
  user: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

export default function UserManagementPage(): ReactElement {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);

    try {
      await authenticatedPost<CreateUserResponse>(
        `${AUTH_API}/create-user`,
        {
          email,
          password,
          isAdmin: isAdmin,
        }
      );

      setSuccessMessage("User created successfully");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create user";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold text-neutral-50">User Management</h1>
        <p className="text-zinc-400">Create new users for the admin panel</p>
      </div>

      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <h2 className="text-xl font-medium text-neutral-50 mb-4">Create New User</h2>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded text-green-200 text-sm">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="user@example.com"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-3 bg-zinc-900 border border-zinc-700 rounded-lg text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
              placeholder="Minimum 8 characters"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-zinc-500">Password must be at least 8 characters long</p>
          </div>

          <div className="flex items-center gap-3">
            <input
              id="isAdmin"
              type="checkbox"
              checked={isAdmin}
              onChange={(e) => setIsAdmin(e.target.checked)}
              className="w-5 h-5 rounded border-zinc-600 bg-zinc-800 text-purple-600 focus:ring-2 focus:ring-purple-600 cursor-pointer"
              disabled={loading}
            />
            <label htmlFor="isAdmin" className="text-sm font-medium text-zinc-300 cursor-pointer">
              Grant admin privileges
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-800 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {loading ? "Creating User..." : "Create User"}
          </button>
        </form>
      </div>

      <div className="bg-zinc-800 rounded-xl p-6 border border-zinc-700">
        <h3 className="text-lg font-medium text-neutral-50 mb-2">Important Notes</h3>
        <ul className="list-disc list-inside space-y-2 text-sm text-zinc-400">
            
          <li>Users should change their password after first login</li>
        </ul>
      </div>
    </div>
  );
}


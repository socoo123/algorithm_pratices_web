import { Link } from 'react-router-dom';

export function NotFoundPage({ message = '页面不存在' }: { message?: string }) {
  return (
    <main className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-dracula-comment">{message}</p>
      <Link to="/" className="mt-4 inline-block text-dracula-cyan hover:text-dracula-pink">
        返回首页
      </Link>
    </main>
  );
}

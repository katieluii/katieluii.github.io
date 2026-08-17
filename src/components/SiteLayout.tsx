import { Outlet, Link, useLocation } from 'react-router-dom';

function NavLink({ to, label }: { to: string; label: string }) {
  const location = useLocation();
  const active = location.pathname === '/' && to.startsWith('/#');

  return (
    <Link
      to={to}
      className={[
        'text-sm transition-colors',
        active ? 'text-zinc-900' : 'text-zinc-600 hover:text-zinc-900',
      ].join(' ')}
    >
      {label}
    </Link>
  );
}

export function SiteLayout() {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-zinc-900">

      <div className="mx-auto w-full max-w-6xl px-6 py-14">
        <header className="flex items-start justify-between gap-6">
          <Link to="/" className="group leading-none">
            <div className="text-sm font-medium tracking-tight group-hover:text-zinc-700 transition-colors">
              Katie
            </div>
            <div className="text-sm text-zinc-500">Comerford</div>
          </Link>

          <nav className="hidden sm:flex items-center gap-5">
            <NavLink to="/#suite" label="Suite" />
            <NavLink to="/#work" label="Work with me" />
            <NavLink to="/projects" label="All projects" />
            <NavLink to="/#interests" label="Interests" />
          </nav>
        </header>

        <main className="mt-14">
          <Outlet />
        </main>

        <footer className="mt-16 text-xs text-zinc-400">
          © 2026 Katie Lui. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

import { Outlet, Link } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div>
     

      <main>
        <Outlet />
      </main>
    </div>
  );
}

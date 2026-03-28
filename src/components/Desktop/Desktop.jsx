import DesktopIcon from './DesktopIcon';

function Desktop({ apps }) {
  return (
    <main className="xp-desktop">
      <section className="desktop-icon-grid" aria-label="Desktop Applications">
        {apps.map((app) => (
          <DesktopIcon key={app.id} icon={app.icon} name={app.name} />
        ))}
      </section>
    </main>
  );
}

export default Desktop;

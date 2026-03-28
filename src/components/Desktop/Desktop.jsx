import DesktopIcon from './DesktopIcon';

function Desktop({ apps, onOpenApp }) {
  return (
    <main className="xp-desktop">
      <section className="desktop-icon-grid" aria-label="Desktop Applications">
        {apps.map((app) => (
          <DesktopIcon key={app.id} icon={app.icon} name={app.name} onOpen={() => onOpenApp(app)} />
        ))}
      </section>
    </main>
  );
}

export default Desktop;

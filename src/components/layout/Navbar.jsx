export default function Navbar({ icon, title, subtitle, children }) {
    return (
        <nav className="navbar">
            <div className="brand">
                {icon} {title}
                {subtitle && <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginLeft: '8px' }}>{subtitle}</span>}
            </div>
            {children && (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {children}
                </div>
            )}
        </nav>
    );
}

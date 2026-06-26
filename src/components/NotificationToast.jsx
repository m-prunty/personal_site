const STYLES = {
    order_confirmation: { borderLeft: '4px solid #22c55e', background: '#f0fdf4' },
    stock_alert:        { borderLeft: '4px solid #f97316', background: '#fff7ed' },
    status_update:      { borderLeft: '4px solid #3b82f6', background: '#eff6ff' },
};

export default function NotificationToast({ notifications, onDismiss }) {
    if (!notifications.length) return null;
    return (
        <div style={{ position: 'fixed', bottom: 16, right: 16, zIndex: 9999,
                      display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 320 }}>
            {notifications.map(n => (
                <div key={n.id} style={{
                    padding: '10px 14px', borderRadius: 6,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.12)', ...STYLES[n.kind]
                }}>
                    <span style={{ fontSize: 14 }}>{n.message}</span>
                    <button onClick={() => onDismiss(n.id)}
                            style={{ marginLeft: 12, background: 'none', border: 'none',
                                     cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
            ))}
        </div>
    );
}

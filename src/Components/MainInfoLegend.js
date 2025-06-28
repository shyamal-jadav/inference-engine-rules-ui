const MainInfoLegend = ({ rules, connections, historyIndex, selectedRule, lastSavedIndex }) => (
    <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        backgroundColor: 'white',
        padding: '12px',
        borderRadius: '6px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        zIndex: 10
    }}>
        <h2 style={{
            fontSize: '18px',
            fontWeight: '600',
            marginBottom: '8px',
            color: '#1f2937'
        }}>Rule Canvas</h2>
        <p style={{
            fontSize: '14px',
            color: '#6b7280'
        }}>Right-click for options</p>
        <div style={{
            fontSize: '12px',
            color: '#9ca3af',
            marginTop: '4px'
        }}>
            Rules: {rules.length} | Dependencies: {connections.length}
        </div>

        <div style={{
            fontSize: '11px',
            color: '#6366f1',
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: '#eef2ff',
            borderRadius: '4px',
            border: '1px solid #c7d2fe'
        }}>
            📝 Ctrl+Z to undo ({historyIndex >= 0 ? historyIndex + 1 : 0} actions)
            {lastSavedIndex >= 0 && <div>🔒 Protected: {lastSavedIndex + 1} saved actions</div>}
        </div>

        {selectedRule && (
            <div style={{
                fontSize: '11px',
                color: '#10b981',
                marginTop: '8px',
                padding: '4px 8px',
                backgroundColor: '#ecfdf5',
                borderRadius: '4px',
                border: '1px solid #d1fae5'
            }}>
                Source: Rule {selectedRule}<br />
                Click target rule to create dependency
            </div>
        )}
    </div>
);

export default MainInfoLegend;
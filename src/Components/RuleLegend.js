const RuleLegend = ({ selectedRuleData, connections, selectedRule, openRuleDetails, deleteRule }) => (
    <div style={{
        position: 'absolute',
        top: '16px',
        right: '16px',
        backgroundColor: 'white',
        padding: '16px',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 10,
        minWidth: '300px',
        maxWidth: '350px',
        border: '2px solid #10b981'
    }}>
        <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '12px',
            gap: '8px'
        }}>
            <div style={{
                width: '12px',
                height: '12px',
                backgroundColor: '#10b981',
                borderRadius: '50%'
            }}></div>
            <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                margin: 0
            }}>Selected Rule</h3>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            <button
                onClick={() => openRuleDetails(selectedRuleData.id)}
                style={{
                    padding: '4px 8px',
                    backgroundColor: '#3b82f6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                }}
            >
                ✏️ Edit Details
            </button>
            <button
                onClick={() => deleteRule(selectedRuleData.id)}
                style={{
                    padding: '4px 8px',
                    backgroundColor: '#dc2626',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    fontSize: '12px',
                    cursor: 'pointer'
                }}
            >
                🗑️ Delete
            </button>
        </div>

        <div style={{ fontSize: '14px', color: '#374151' }}>
            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Name: </span>
                <span>{selectedRuleData.label}</span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>ID: </span>
                <span>#{selectedRuleData.id}</span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Description: </span>
                <span>{selectedRuleData.description}</span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Eligibility: </span>
                <span style={{ color: selectedRuleData.eligibility ? '#374151' : '#9ca3af' }}>
                    {selectedRuleData.eligibility || 'Not specified'}
                </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Conditions: </span>
                <span style={{ color: selectedRuleData.conditions ? '#374151' : '#9ca3af' }}>
                    {selectedRuleData.conditions || 'Not specified'}
                </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Action: </span>
                <span style={{ color: selectedRuleData.action ? '#374151' : '#9ca3af' }}>
                    {selectedRuleData.action || 'Not specified'}
                </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Alt Action: </span>
                <span style={{ color: selectedRuleData.alterAction ? '#374151' : '#9ca3af' }}>
                    {selectedRuleData.alterAction || 'Not specified'}
                </span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Priority: </span>
                <span style={{
                    padding: '2px 6px',
                    backgroundColor: selectedRuleData.priority === 'High' ? '#fef2f2' : selectedRuleData.priority === 'Low' ? '#f0f9ff' : '#fef3c7',
                    color: selectedRuleData.priority === 'High' ? '#dc2626' : selectedRuleData.priority === 'Low' ? '#0284c7' : '#d97706',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>{selectedRuleData.priority}</span>
            </div>

            <div style={{ marginBottom: '8px' }}>
                <span style={{ fontWeight: '500', color: '#6b7280' }}>Created: </span>
                <span>{selectedRuleData.createdAt}</span>
            </div>

            {/* Connection info */}
            <div style={{
                marginTop: '12px',
                padding: '8px',
                backgroundColor: '#f9fafb',
                borderRadius: '4px',
                fontSize: '12px'
            }}>
                <div style={{ fontWeight: '500', color: '#6b7280', marginBottom: '4px' }}>
                    Connections:
                </div>
                <div>
                    Outgoing: {connections.filter(c => c.from === selectedRule).length}
                </div>
                <div>
                    Incoming: {connections.filter(c => c.to === selectedRule).length}
                </div>
            </div>
        </div>
    </div>
);

export default RuleLegend;
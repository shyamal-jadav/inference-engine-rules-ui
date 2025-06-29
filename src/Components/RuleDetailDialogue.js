import React from 'react';

const RuleDetailDialogue = ({ setShowRuleDetails, ruleForm, setRuleForm, saveRuleDetails }) => {

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }} onClick={() => setShowRuleDetails(false)}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '8px',
                padding: '24px',
                width: '500px',
                maxHeight: '80vh',
                overflowY: 'auto',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
            }} onClick={(e) => e.stopPropagation()}>
                <h3 style={{
                    fontSize: '20px',
                    fontWeight: '600',
                    marginBottom: '20px',
                    color: '#1f2937'
                }}>Edit Rule Details</h3>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                        Label
                    </label>
                    <input
                        type="text"
                        value={ruleForm.label}
                        onChange={(e) => setRuleForm({ ...ruleForm, label: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                        Description
                    </label>
                    <textarea
                        value={ruleForm.description}
                        onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '60px',
                            resize: 'vertical'
                        }}
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                        Eligibility
                    </label>
                    <textarea
                        value={ruleForm.eligibility}
                        onChange={(e) => setRuleForm({ ...ruleForm, eligibility: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '60px',
                            resize: 'vertical'
                        }}
                        placeholder="Define who is eligible for this rule..."
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                        Conditions
                    </label>
                    <textarea
                        value={ruleForm.conditions}
                        onChange={(e) => setRuleForm({ ...ruleForm, conditions: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '60px',
                            resize: 'vertical'
                        }}
                        placeholder="Define the conditions that must be met..."
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                        Action
                    </label>
                    <textarea
                        value={ruleForm.action}
                        onChange={(e) => setRuleForm({ ...ruleForm, action: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '60px',
                            resize: 'vertical'
                        }}
                        placeholder="Define the primary action to take..."
                    />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                        Alternative Action
                    </label>
                    <textarea
                        value={ruleForm.alterAction}
                        onChange={(e) => setRuleForm({ ...ruleForm, alterAction: e.target.value })}
                        style={{
                            width: '100%',
                            padding: '8px',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            minHeight: '60px',
                            resize: 'vertical'
                        }}
                        placeholder="Define the alternative action..."
                    />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '4px', color: '#374151' }}>
                            Priority
                        </label>
                        <select
                            value={ruleForm.priority}
                            onChange={(e) => setRuleForm({ ...ruleForm, priority: e.target.value })}
                            style={{
                                width: '100%',
                                padding: '8px',
                                border: '1px solid #d1d5db',
                                borderRadius: '4px',
                                fontSize: '14px'
                            }}
                        >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '24px' }}>
                    <button
                        onClick={() => setShowRuleDetails(false)}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f3f4f6',
                            color: '#374151',
                            border: '1px solid #d1d5db',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={saveRuleDetails}
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#3b82f6',
                            color: 'white',
                            border: 'none',
                            borderRadius: '4px',
                            fontSize: '14px',
                            cursor: 'pointer'
                        }}
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RuleDetailDialogue;
import React, { useState, useRef, useEffect, useCallback } from 'react';
import RuleLegend from './Components/RuleLegend';
import MainInfoLegend from './Components/MainInfoLegend';

const RuleCanvas = () => {
  const [rules, setRules] = useState([]);
  const [ruleIdCounter, setRuleIdCounter] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);

  // Connection state
  const [connections, setConnections] = useState([]);
  const [selectedRule, setSelectedRule] = useState(null);

  // Context menu state
  const [contextMenu, setContextMenu] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [editLabel, setEditLabel] = useState('');

  // Rule details modal state
  const [showRuleDetails, setShowRuleDetails] = useState(false);
  const [editingRuleDetails, setEditingRuleDetails] = useState(null);
  const [ruleForm, setRuleForm] = useState({
    label: '',
    description: '',
    eligibility: '',
    conditions: '',
    action: '',
    alterAction: '',
    priority: 'Medium'
  });

  // Undo functionality
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [lastSavedIndex, setLastSavedIndex] = useState(-1);

  // Save state to history
  const saveToHistory = (action) => {
    const currentState = {
      rules: [...rules],
      connections: [...connections],
      selectedRule,
      action,
      timestamp: Date.now(),
      isSaved: false  // Add this line
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);

    if (newHistory.length > 50) {
      newHistory.shift();
      // Add these lines:
      if (lastSavedIndex >= 0) {
        setLastSavedIndex(Math.max(-1, lastSavedIndex - 1));
      }
    } else {
      setHistoryIndex(historyIndex + 1);
    }

    setHistory(newHistory);
  };

  const markAsSaved = () => {
    if (historyIndex >= 0) {
      setLastSavedIndex(historyIndex);
      setHistory(prev => prev.map((state, index) =>
        index === historyIndex ? { ...state, isSaved: true } : state
      ));
    }
  };

  // Undo functionality
  const undo = useCallback(() => {
    const minIndex = Math.max(0, lastSavedIndex);

    if (historyIndex > minIndex) {
      const previousState = history[historyIndex - 1];
      setRules(previousState.rules);
      setConnections(previousState.connections);
      setSelectedRule(previousState.selectedRule);
      setHistoryIndex(historyIndex - 1);

      setContextMenu(null);
      setShowRuleDetails(false);
      setEditingRule(null);
    }
  }, [historyIndex, history, lastSavedIndex]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        undo();
      }
      if (e.key === 'Escape' && showRuleDetails) {
        e.preventDefault();
        setShowRuleDetails(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, showRuleDetails]);

  const handleCanvasClick = (e) => {
    // Hide context menu on any click
    setContextMenu(null);

    // Don't create rules if we just finished dragging
    if (isDragging || hasDragged) {
      setIsDragging(false);
      setHasDragged(false);
      return;
    }

    // Cancel editing if clicking elsewhere
    if (editingRule) {
      cancelRuleEdit();
      return;
    }

    // Close rule details modal
    if (showRuleDetails) {
      setShowRuleDetails(false);
      return;
    }

    // Deselect any selected rule when clicking empty space
    if (selectedRule) {
      setSelectedRule(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Save current state before creating new rule
    saveToHistory('Create Rule');

    const newRule = {
      id: ruleIdCounter,
      x: x - 25,
      y: y - 25,
      label: `Rule ${ruleIdCounter}`,
      description: `This is rule ${ruleIdCounter}`,
      status: 'Active',
      eligibility: '',
      conditions: '',
      action: '',
      alterAction: '',
      priority: 'Medium',
      createdAt: new Date().toLocaleDateString()
    };

    setRules([...rules, newRule]);
    setRuleIdCounter(ruleIdCounter + 1);
  };

  const handleRuleClick = (e, ruleId) => {
    e.stopPropagation();

    // Hide context menu
    setContextMenu(null);

    // Prevent connection logic if we just finished dragging
    if (isDragging || hasDragged) {
      setHasDragged(false);
      return;
    }

    if (selectedRule === null) {
      setSelectedRule(ruleId);
    } else if (selectedRule === ruleId) {
      setSelectedRule(null);
    } else {
      // Save state before creating connection
      saveToHistory('Create Connection');

      const newConnection = {
        id: `${selectedRule}-${ruleId}`,
        from: selectedRule,
        to: ruleId
      };

      const exists = connections.some(conn =>
        conn.from === selectedRule && conn.to === ruleId
      );

      if (!exists) {
        setConnections([...connections, newConnection]);
      }

      setSelectedRule(null);
    }
  };

  const handleRuleRightClick = (e, ruleId) => {
    e.preventDefault();
    e.stopPropagation();

    // Select the rule when right-clicking
    setSelectedRule(ruleId);

    const rule = rules.find(n => n.id === ruleId);
    setContextMenu({
      x: rule.x + 60,
      y: rule.y,
      ruleId: ruleId,
      type: 'rule'
    });
  };

  const handleConnectionRightClick = (e, connectionId) => {
    e.preventDefault();
    e.stopPropagation();

    const connection = connections.find(c => c.id === connectionId);
    const fromRule = rules.find(n => n.id === connection.from);
    const toRule = rules.find(n => n.id === connection.to);

    const midX = (fromRule.x + toRule.x) / 2 + 25;
    const midY = (fromRule.y + toRule.y) / 2 + 25;

    setContextMenu({
      x: midX,
      y: midY,
      connectionId: connectionId,
      type: 'connection'
    });
  };

  const deleteRule = (ruleId) => {
    saveToHistory('Delete Rule');

    setRules(rules.filter(rule => rule.id !== ruleId));
    setConnections(connections.filter(conn =>
      conn.from !== ruleId && conn.to !== ruleId
    ));

    if (selectedRule === ruleId) {
      setSelectedRule(null);
    }

    setContextMenu(null);
  };

  const deleteConnection = (connectionId) => {
    saveToHistory('Delete Connection');
    setConnections(connections.filter(conn => conn.id !== connectionId));
    setContextMenu(null);
  };

  const startEditRule = (ruleId) => {
    const rule = rules.find(n => n.id === ruleId);
    setEditingRule(ruleId);
    setEditLabel(rule.label);
    setContextMenu(null);
  };

  const openRuleDetails = (ruleId) => {
    const rule = rules.find(n => n.id === ruleId);
    setEditingRuleDetails(ruleId);
    setRuleForm({
      label: rule.label,
      description: rule.description,
      eligibility: rule.eligibility || '',
      conditions: rule.conditions || '',
      action: rule.action || '',
      alterAction: rule.alterAction || '',
      priority: rule.priority || 'Medium'
    });
    setShowRuleDetails(true);
    setContextMenu(null);
  };

  const saveRuleDetails = () => {
    saveToHistory('Update Rule Details');

    setRules(rules.map(rule =>
      rule.id === editingRuleDetails
        ? { ...rule, ...ruleForm }
        : rule
    ));

    setShowRuleDetails(false);
    setEditingRuleDetails(null);

    // Add this line to mark as saved:
    setTimeout(() => markAsSaved(), 0);
  };

  const saveRuleEdit = () => {
    if (editLabel.trim()) {
      saveToHistory('Edit Rule Label');
      setRules(rules.map(rule =>
        rule.id === editingRule
          ? { ...rule, label: editLabel.trim() }
          : rule
      ));
    }
    setEditingRule(null);
    setEditLabel('');
  };

  const cancelRuleEdit = () => {
    setEditingRule(null);
    setEditLabel('');
  };

  const handleMouseDown = (e, ruleId) => {
    if (selectedRule) return;

    e.stopPropagation();
    e.preventDefault();

    const rule = rules.find(n => n.id === ruleId);
    const rect = e.currentTarget.parentElement.getBoundingClientRect();

    setDragging(ruleId);
    setHasDragged(false);
    setDragOffset({
      x: e.clientX - rect.left - rule.x,
      y: e.clientY - rect.top - rule.y
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;

    if (!hasDragged) {
      saveToHistory('Move Rule');
    }

    setIsDragging(true);
    setHasDragged(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;

    setRules(rules.map(rule =>
      rule.id === dragging
        ? { ...rule, x: newX, y: newY }
        : rule
    ));
  };

  const handleMouseUp = () => {
    if (dragging) {
      setTimeout(() => {
        setIsDragging(false);
        setTimeout(() => {
          setHasDragged(false);
        }, 100);
      }, 50);
    }
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  // Get selected rule data
  const selectedRuleData = selectedRule ? rules.find(rule => rule.id === selectedRule) : null;

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#f3f4f6',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Main Info Panel */}
      <MainInfoLegend
        rules={rules}
        connections={connections}
        historyIndex={historyIndex}
        selectedRule={selectedRule}
        lastSavedIndex={lastSavedIndex}
      />

      {/* Selected Rule Legend */}
      {selectedRuleData &&
        <RuleLegend
          selectedRuleData={selectedRuleData}
          connections={connections}
          selectedRule={selectedRule}
          openRuleDetails={openRuleDetails}
          deleteRule={deleteRule}
        />
      }

      {/* Rule Details Modal */}
      {showRuleDetails && (
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
      )}

      {/* Canvas Area */}
      <div
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f9fafb',
          border: '2px dashed #d1d5db',
          position: 'relative',
          cursor: dragging ? 'grabbing' : (selectedRule ? 'pointer' : 'crosshair')
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu(null);
        }}
      >
        {/* SVG for connections */}
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {connections.map(connection => {
            const fromRule = rules.find(n => n.id === connection.from);
            const toRule = rules.find(n => n.id === connection.to);

            if (!fromRule || !toRule) return null;

            const fromX = fromRule.x + 25;
            const fromY = fromRule.y + 25;
            const toX = toRule.x + 25;
            const toY = toRule.y + 25;

            const dx = toX - fromX;
            const dy = toY - fromY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const ruleRadius = 25;

            const adjustedToX = toX - (dx / length) * ruleRadius;
            const adjustedToY = toY - (dy / length) * ruleRadius;

            return (
              <g key={connection.id}>
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={adjustedToX}
                  y2={adjustedToY}
                  stroke="#374151"
                  strokeWidth="2"
                  markerEnd="url(#arrowhead)"
                />
                <line
                  x1={fromX}
                  y1={fromY}
                  x2={adjustedToX}
                  y2={adjustedToY}
                  stroke="transparent"
                  strokeWidth="12"
                  style={{ pointerEvents: 'all', cursor: 'pointer' }}
                  onContextMenu={(e) => handleConnectionRightClick(e, connection.id)}
                />
              </g>
            );
          })}

          <defs>
            <marker
              id="arrowhead"
              markerWidth="12"
              markerHeight="8"
              refX="11"
              refY="4"
              orient="auto"
            >
              <polygon
                points="0 0, 12 4, 0 8"
                fill="#374151"
              />
            </marker>
          </defs>
        </svg>

        {rules.length === 0 ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#9ca3af',
            fontSize: '16px',
            zIndex: 2,
            position: 'relative'
          }}>
            {selectedRule ? 'Click empty space to deselect, or click target rule' : 'Click to create rules, right-click for options'}
          </div>
        ) : null}

        {/* Render Rules */}
        {rules.map(rule => {
          const isSelected = selectedRule === rule.id;
          const isDraggingThis = dragging === rule.id;
          const isEditing = editingRule === rule.id;

          return (
            <div key={rule.id}>
              {/* Rule */}
              <div
                style={{
                  position: 'absolute',
                  left: rule.x,
                  top: rule.y,
                  width: '50px',
                  height: '50px',
                  backgroundColor: isSelected ? '#10b981' : (isDraggingThis ? '#2563eb' : '#3b82f6'),
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: '600',
                  cursor: selectedRule && selectedRule !== rule.id ? 'pointer' : (isDraggingThis ? 'grabbing' : 'grab'),
                  boxShadow: isDraggingThis ? '0 4px 8px rgba(0,0,0,0.2)' : (isSelected ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'),
                  userSelect: 'none',
                  transform: isDraggingThis ? 'scale(1.1)' : (isSelected ? 'scale(1.05)' : 'scale(1)'),
                  transition: isDraggingThis ? 'none' : 'all 0.1s ease',
                  zIndex: isDraggingThis ? 10 : (isSelected ? 5 : 2)
                }}
                onMouseDown={(e) => !isEditing && handleMouseDown(e, rule.id)}
                onClick={(e) => !isEditing && handleRuleClick(e, rule.id)}
                onContextMenu={(e) => !isEditing && handleRuleRightClick(e, rule.id)}
              >
                {isEditing ? (
                  <input
                    type="text"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onBlur={saveRuleEdit}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Enter') saveRuleEdit();
                      if (e.key === 'Escape') cancelRuleEdit();
                    }}
                    style={{
                      width: '40px',
                      height: '20px',
                      border: 'none',
                      outline: 'none',
                      fontSize: '10px',
                      textAlign: 'center',
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      color: '#374151',
                      borderRadius: '3px',
                      padding: '2px'
                    }}
                    autoFocus
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '45px' }}>
                    {rule.label.length > 6 ? rule.label.substring(0, 6) + '...' : rule.label}
                  </span>
                )}
              </div>

            </div>
          );
        })}

        {/* Context Menu */}
        {contextMenu && (
          <div
            style={{
              position: 'absolute',
              left: contextMenu.x,
              top: contextMenu.y,
              backgroundColor: 'white',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              zIndex: 100,
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {contextMenu.type === 'rule' ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    startEditRule(contextMenu.ruleId);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#374151',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  ✏️ Edit Label
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openRuleDetails(contextMenu.ruleId);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#374151',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    borderBottom: '1px solid #e5e7eb'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  📋 Edit Details
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteRule(contextMenu.ruleId);
                  }}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '8px 12px',
                    fontSize: '12px',
                    color: '#dc2626',
                    backgroundColor: 'transparent',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  🗑️ Delete
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConnection(contextMenu.connectionId);
                }}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '8px 12px',
                  fontSize: '12px',
                  color: '#dc2626',
                  backgroundColor: 'transparent',
                  border: 'none',
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
              >
                🗑️ Delete Connection
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleCanvas;
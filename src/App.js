import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import RuleLegend from './Components/RuleLegend';
import MainInfoLegend from './Components/MainInfoLegend';
import RuleDetailDialogue from './Components/RuleDetailDialogue';


const RuleCanvas = () => {
  const transformRef = useRef(null);

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

  const [isPanningLib, setIsPanningLib] = useState(false);
  const [hasPannedDown, setHasPannedDown] = useState(false);
  const [currentPanY, setCurrentPanY] = useState(0);

  // Custom panning state
  const [isCustomPanning, setIsCustomPanning] = useState(false);
  const [panStartY, setPanStartY] = useState(0);
  const [panStartPositionY, setPanStartPositionY] = useState(0);

  // Error message state
  const [errorMessage, setErrorMessage] = useState('');

  // On mount, save the initial empty state to history
  useEffect(() => {
    if (history.length === 0) {
      const initialState = {
        rules: [],
        connections: [],
        selectedRule: null,
        action: 'Initial',
        timestamp: Date.now(),
        isSaved: false
      };
      setHistory([initialState]);
      setHistoryIndex(0);
    }
  }, []);

  // Save state to history
  const saveToHistory = (action, rulesArg = rules, connectionsArg = connections, selectedRuleArg = selectedRule) => {
    // Only save history for specific actions, not for position changes
    // Tracked actions: Create/Delete nodes, Create/Delete connections, Edit labels/details
    // NOT tracked: Position changes (dragging), panning, selection changes
    const actionsToSave = ['Create Rule', 'Delete Rule', 'Create Connection', 'Delete Connection', 'Edit Rule Label', 'Update Rule Details'];
    
    if (!actionsToSave.includes(action)) {
      return; // Don't save history for other actions like position changes
    }

    const currentState = {
      rules: [...rulesArg],
      connections: [...connectionsArg],
      selectedRule: selectedRuleArg,
      action,
      timestamp: Date.now(),
      isSaved: false
    };

    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(currentState);

    if (newHistory.length > 50) {
      newHistory.shift();
    }
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  // Undo functionality
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousState = history[historyIndex - 1];
      setRules(previousState.rules);
      setConnections(previousState.connections);
      setSelectedRule(previousState.selectedRule);
      setHistoryIndex(historyIndex - 1);
      setContextMenu(null);
      setShowRuleDetails(false);
      setEditingRule(null);
    }
  }, [historyIndex, history]);

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
    setContextMenu(null);
    if (isDragging || hasDragged || isPanningLib) {
      setIsDragging(false);
      setHasDragged(false);
      return;
    }
    if (editingRule) { cancelRuleEdit(); return; }
    if (showRuleDetails) { setShowRuleDetails(false); return; }
    if (selectedRule) { setSelectedRule(null); return; }
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const newRule = {
      id: ruleIdCounter,
      x: x - 35,
      y: y - 35,
      label: `Rule ${ruleIdCounter}`,
      description: `This is rule ${ruleIdCounter}`,
      status: 'Active', eligibility: '', conditions: '', action: '', alterAction: '', priority: 'Medium', createdAt: new Date().toLocaleDateString()
    };
    const newRules = [...rules, newRule];
    setRules(newRules);
    setRuleIdCounter(ruleIdCounter + 1);
    saveToHistory('Create Rule', newRules, connections, selectedRule);
  };

  // Utility: Detect cycle in directed graph
  function wouldCreateCycle(connections, from, to) {
    // Simple DFS to see if 'to' can reach 'from' (which would create a cycle)
    const adj = {};
    connections.forEach(conn => {
      if (!adj[conn.from]) adj[conn.from] = [];
      adj[conn.from].push(conn.to);
    });
    // Add the new edge
    if (!adj[from]) adj[from] = [];
    adj[from].push(to);
    // DFS
    const stack = [to];
    const visited = new Set();
    while (stack.length) {
      const node = stack.pop();
      if (node === from) return true;
      if (!visited.has(node) && adj[node]) {
        visited.add(node);
        stack.push(...adj[node]);
      }
    }
    return false;
  }

  // --- Edge creation ---
  const handleRuleClick = (e, ruleId) => {
    e.stopPropagation();
    setContextMenu(null);
    if (isDragging || hasDragged) { setHasDragged(false); return; }
    if (selectedRule === null) {
      setSelectedRule(ruleId);
    } else if (selectedRule === ruleId) {
      setSelectedRule(null);
    } else {
      const newConnection = { id: `${selectedRule}-${ruleId}`, from: selectedRule, to: ruleId };
      const exists = connections.some(conn => conn.from === selectedRule && conn.to === ruleId);
      if (!exists) {
        // Check for cycle
        if (wouldCreateCycle(connections, selectedRule, ruleId)) {
          setErrorMessage('Cannot create chain: this would create a cycle');
          setTimeout(() => setErrorMessage(''), 3000);
        } else {
          const newConnections = [...connections, newConnection];
          setConnections(newConnections);
          saveToHistory('Create Connection', rules, newConnections, null);
        }
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
    setRules(prevRules => {
      const newRules = prevRules.filter(rule => rule.id !== ruleId);
      setConnections(prevConnections => {
        const newConnections = prevConnections.filter(conn => conn.from !== ruleId && conn.to !== ruleId);
        // Save to history with the latest state
        saveToHistory('Delete Rule', newRules, newConnections, selectedRule === ruleId ? null : selectedRule);
        return newConnections;
      });
      if (selectedRule === ruleId) setSelectedRule(null);
      setContextMenu(null);
      return newRules;
    });
  };

  const deleteConnection = (connectionId) => {
    const newConnections = connections.filter(conn => conn.id !== connectionId);
    setConnections(newConnections);
    setContextMenu(null);
    saveToHistory('Delete Connection', rules, newConnections, selectedRule);
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

  const saveRuleEdit = () => {
    if (editLabel.trim()) {
      const newRules = rules.map(rule => rule.id === editingRule ? { ...rule, label: editLabel.trim() } : rule);
      setRules(newRules);
      // No saveToHistory here: edits are not undoable
    }
    setEditingRule(null);
    setEditLabel('');
  };

  const saveRuleDetails = () => {
    const newRules = rules.map(rule => rule.id === editingRuleDetails ? { ...rule, ...ruleForm } : rule);
    setRules(newRules);
    setShowRuleDetails(false);
    setEditingRuleDetails(null);
    // No saveToHistory here: edits are not undoable
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

    // End custom panning
    if (isCustomPanning) {
      setIsCustomPanning(false);
      setIsPanningLib(false);
    }
  };

  // Custom panning handlers
  const handleCanvasMouseDown = (e) => {
    console.log('Canvas mouse down event:', {
      button: e.button,
      ctrlKey: e.ctrlKey,
      shiftKey: e.shiftKey,
      altKey: e.altKey,
      dragging,
      editingRule,
      isCustomPanning
    });

    // Only start panning if not dragging a rule and not editing
    if (dragging || editingRule) {
      console.log('Blocked by dragging or editing');
      return;
    }

    // Allow panning with middle mouse button OR Ctrl + left mouse button
    const isMiddleClick = e.button === 1;
    const isCtrlLeftClick = e.button === 0 && e.ctrlKey;
    
    console.log('Panning conditions:', { isMiddleClick, isCtrlLeftClick });
    
    if (!isMiddleClick && !isCtrlLeftClick) {
      console.log('No panning trigger detected');
      return;
    }

    console.log('Starting custom panning');
    e.preventDefault();
    e.stopPropagation();
    setIsCustomPanning(true);
    setIsPanningLib(true);
    setPanStartY(e.clientY);
    
    const transform = transformRef.current?.instance;
    if (transform && transform.state) {
      setPanStartPositionY(transform.state.positionY);
      console.log('Set pan start position:', transform.state.positionY);
    } else {
      console.log('Transform not available');
    }
  };

  const handleCanvasMouseMove = (e) => {
    if (!isCustomPanning) return;

    console.log('Custom panning move:', {
      deltaY: e.clientY - panStartY,
      newPositionY: panStartPositionY + (e.clientY - panStartY),
      currentPanY,
      hasPannedDown
    });

    const deltaY = e.clientY - panStartY;
    const newPositionY = panStartPositionY + deltaY;

    // Check if trying to pan up before having panned down
    if (newPositionY < currentPanY && !hasPannedDown) {
      console.log('Blocked panning up - not allowed yet');
      return; // Prevent panning up
    }

    // Update panning state
    if (newPositionY > currentPanY) {
      setHasPannedDown(true);
      console.log('Now allowed to pan up');
    }

    setCurrentPanY(newPositionY);

    // Apply the transform with error handling
    try {
      const transform = transformRef.current?.instance;
      if (transform && transform.state) {
        const currentScale = transform.state.scale || 1;
        const currentPositionX = transform.state.positionX || 0;
        transform.setTransform(currentScale, currentPositionX, newPositionY);
        console.log('Applied transform:', { scale: currentScale, x: currentPositionX, y: newPositionY });
      }
    } catch (error) {
      console.warn('Transform error:', error);
      setIsCustomPanning(false);
      setIsPanningLib(false);
    }
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
        <RuleDetailDialogue
          setShowRuleDetails={setShowRuleDetails}
          ruleForm={ruleForm}
          setRuleForm={setRuleForm}
          saveRuleDetails={saveRuleDetails}
        />
      )}

      {/* Error Message */}
      {errorMessage && (
        <div style={{
          position: 'absolute',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: '#fee2e2',
          color: '#b91c1c',
          padding: '10px 24px',
          borderRadius: '8px',
          fontWeight: 600,
          fontSize: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          zIndex: 1000,
          border: '1px solid #fca5a5',
        }}>
          {errorMessage}
        </div>
      )}

      {/* Canvas Area */}
      <TransformWrapper
        initialScale={1}
        initialPositionX={0}
        initialPositionY={0}
        minScale={1}
        maxScale={1}
        wheel={{ disabled: true }}
        panning={{
          disabled: false, // Enable default panning but with restrictions
          velocityDisabled: false,
          velocityAnimationTime: 0.25,
          velocityBaseTime: 0.25,
          velocityAnimation: true
        }}
        doubleClick={{ disabled: true }}
        limitToBounds={false}
        centerOnInit={false}
        minPositionX={0}
        maxPositionX={0}
        minPositionY={-2500}
        maxPositionY={2500}
        alignmentAnimation={{ disabled: true }}
        velocityAnimation={{ disabled: false }}
        zoomIn={{ disabled: true }}
        zoomOut={{ disabled: true }}
        ref={transformRef}
        onPanningStart={(e) => {
          console.log('TransformWrapper panning start:', e);
          setIsPanningLib(true);
        }}
        onPanningStop={(e) => {
          console.log('TransformWrapper panning stop:', e);
          setTimeout(() => setIsPanningLib(false), 100);
        }}
        onTransformStart={(e) => {
          console.log('TransformWrapper transform start:', e);
          setIsPanningLib(true);
        }}
        onTransformStop={(e) => {
          console.log('TransformWrapper transform stop:', e);
          setTimeout(() => setIsPanningLib(false), 100);
        }}
      >
        <TransformComponent
          wrapperStyle={{
            width: '100%',
            height: '100%',
            backgroundColor: '#f9fafb',
            border: '2px dashed #d1d5db'
          }}
          contentStyle={{
            width: '5000px',
            height: '5000px',
            position: 'relative'
          }}
        >

          <div
            style={{
              width: '5000px',
              height: '5000px',
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: dragging ? 'grabbing' : (selectedRule ? 'pointer' : 'crosshair')
            }}
            onClick={handleCanvasClick}
            onMouseMove={(e) => {
              handleMouseMove(e);
              handleCanvasMouseMove(e);
            }}
            onMouseUp={handleMouseUp}
            onMouseDown={handleCanvasMouseDown}
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

                const fromX = fromRule.x + 35;
                const fromY = fromRule.y + 35;
                const toX = toRule.x + 35;
                const toY = toRule.y + 35;

                const dx = toX - fromX;
                const dy = toY - fromY;
                const length = Math.sqrt(dx * dx + dy * dy);
                const ruleRadius = 35;

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
                      width: '70px',
                      height: '70px',
                      backgroundColor: isSelected ? '#10b981' : (isDraggingThis ? '#2563eb' : '#3b82f6'),
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '11px',
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
                          width: '60px',
                          height: '25px',
                          border: 'none',
                          outline: 'none',
                          fontSize: '11px',
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
                      <span style={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '65px',
                        textAlign: 'center',
                        lineHeight: '1.2'
                      }}>
                        {rule.label.length > 8 ? rule.label.substring(0, 8) + '...' : rule.label}
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
        </TransformComponent>
      </TransformWrapper>

    </div>
  );
};

export default RuleCanvas;
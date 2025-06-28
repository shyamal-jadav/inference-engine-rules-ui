import React, { useState, useRef } from 'react';

const NodeCanvas = () => {
  const [nodes, setNodes] = useState([]);
  const [nodeIdCounter, setNodeIdCounter] = useState(1);
  const [dragging, setDragging] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false); // Track if we actually moved during drag
  
  // Connection state
  const [connections, setConnections] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  const handleCanvasClick = (e) => {
    // Don't create nodes if we just finished dragging
    if (isDragging || hasDragged) {
      setIsDragging(false);
      setHasDragged(false);
      return;
    }
    
    // Deselect any selected node when clicking empty space
    if (selectedNode) {
      setSelectedNode(null);
      return;
    }
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newNode = {
      id: nodeIdCounter,
      x: x - 25, // Center the node on click point
      y: y - 25,
      label: `Node ${nodeIdCounter}`
    };
    
    setNodes([...nodes, newNode]);
    setNodeIdCounter(nodeIdCounter + 1);
  };

  const handleNodeClick = (e, nodeId) => {
    e.stopPropagation();
    
    // Prevent connection logic if we just finished dragging
    if (isDragging || hasDragged) {
      setHasDragged(false);
      return;
    }
    
    if (selectedNode === null) {
      // First node selection (source)
      setSelectedNode(nodeId);
    } else if (selectedNode === nodeId) {
      // Clicking same node - deselect
      setSelectedNode(null);
    } else {
      // Second node - create directed connection (from selectedNode TO nodeId)
      const newConnection = {
        id: `${selectedNode}-${nodeId}`,
        from: selectedNode,
        to: nodeId
      };
      
      // Check if connection already exists in this direction
      const exists = connections.some(conn => 
        conn.from === selectedNode && conn.to === nodeId
      );
      
      if (!exists) {
        setConnections([...connections, newConnection]);
      }
      
      setSelectedNode(null);
    }
  };

  const handleMouseDown = (e, nodeId) => {
    // Don't start dragging if a node is selected for connection
    if (selectedNode) return;
    
    e.stopPropagation(); // Prevent canvas click
    e.preventDefault(); // Prevent text selection
    
    const node = nodes.find(n => n.id === nodeId);
    const rect = e.currentTarget.parentElement.getBoundingClientRect();
    
    setDragging(nodeId);
    setHasDragged(false); // Reset drag tracking
    setDragOffset({
      x: e.clientX - rect.left - node.x,
      y: e.clientY - rect.top - node.y
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging) return;
    
    setIsDragging(true); // Mark that we're actively dragging
    setHasDragged(true); // Mark that we actually moved
    
    const rect = e.currentTarget.getBoundingClientRect();
    const newX = e.clientX - rect.left - dragOffset.x;
    const newY = e.clientY - rect.top - dragOffset.y;
    
    setNodes(nodes.map(node => 
      node.id === dragging 
        ? { ...node, x: newX, y: newY }
        : node
    ));
  };

  const handleMouseUp = () => {
    if (dragging) {
      // Add a small delay to prevent immediate interaction
      setTimeout(() => {
        setIsDragging(false);
        // Keep hasDragged true briefly to prevent click events
        setTimeout(() => {
          setHasDragged(false);
        }, 100);
      }, 50);
    }
    setDragging(null);
    setDragOffset({ x: 0, y: 0 });
  };

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: '#f3f4f6',
      position: 'relative',
      overflow: 'hidden'
    }}>
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
        }}>Node Canvas</h2>
        <p style={{
          fontSize: '14px',
          color: '#6b7280'
        }}>Fixed: No drag/connection interference</p>
        <div style={{
          fontSize: '12px',
          color: '#9ca3af',
          marginTop: '4px'
        }}>
          Nodes: {nodes.length} | Dependencies: {connections.length}
        </div>
        
        {selectedNode && (
          <div style={{
            fontSize: '11px',
            color: '#10b981',
            marginTop: '8px',
            padding: '4px 8px',
            backgroundColor: '#ecfdf5',
            borderRadius: '4px',
            border: '1px solid #d1fae5'
          }}>
            Source: Node {selectedNode}<br/>
            Click target node to create dependency
          </div>
        )}
      </div>
      
      {/* Canvas Area */}
      <div 
        style={{
          width: '100%',
          height: '100%',
          backgroundColor: '#f9fafb',
          border: '2px dashed #d1d5db',
          position: 'relative',
          cursor: dragging ? 'grabbing' : (selectedNode ? 'pointer' : 'crosshair')
        }}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
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
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (!fromNode || !toNode) return null;
            
            const fromX = fromNode.x + 25; // Center of node
            const fromY = fromNode.y + 25;
            const toX = toNode.x + 25;
            const toY = toNode.y + 25;
            
            // Calculate arrow positioning to stop at node edge
            const dx = toX - fromX;
            const dy = toY - fromY;
            const length = Math.sqrt(dx * dx + dy * dy);
            const nodeRadius = 25;
            
            // Adjust end point to node edge
            const adjustedToX = toX - (dx / length) * nodeRadius;
            const adjustedToY = toY - (dy / length) * nodeRadius;
            
            return (
              <line
                key={connection.id}
                x1={fromX}
                y1={fromY}
                x2={adjustedToX}
                y2={adjustedToY}
                stroke="#374151"
                strokeWidth="2"
                markerEnd="url(#arrowhead)"
              />
            );
          })}
          
          {/* Arrow marker definition */}
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
        {nodes.length === 0 ? (
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
            {selectedNode ? 'Click empty space to deselect, or click target node' : 'Click to create nodes, click nodes to connect'}
          </div>
        ) : null}
        
        {/* Render Nodes */}
        {nodes.map(node => {
          const isSelected = selectedNode === node.id;
          const isDraggingThis = dragging === node.id;
          
          return (
            <div
              key={node.id}
              style={{
                position: 'absolute',
                left: node.x,
                top: node.y,
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
                cursor: selectedNode ? 'pointer' : (isDraggingThis ? 'grabbing' : 'grab'),
                boxShadow: isDraggingThis ? '0 4px 8px rgba(0,0,0,0.2)' : (isSelected ? '0 0 0 3px rgba(16, 185, 129, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'),
                userSelect: 'none',
                transform: isDraggingThis ? 'scale(1.1)' : (isSelected ? 'scale(1.05)' : 'scale(1)'),
                transition: isDraggingThis ? 'none' : 'all 0.1s ease',
                zIndex: isDraggingThis ? 10 : (isSelected ? 5 : 2)
              }}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onClick={(e) => handleNodeClick(e, node.id)}
            >
              {node.id}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default NodeCanvas;
import { useState, useRef, useEffect } from 'react';
import { FaPaintBrush, FaMousePointer, FaSquare, FaHandPointer, FaKeyboard, FaPencilAlt, FaCode, FaDownload, FaUpload, FaTrash } from 'react-icons/fa';

const HANDLE_SIZE = 12;

function Whiteboard({ onGenerateCode }) {
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const [mode, setMode] = useState('draw');
    const [selectedTool, setSelectedTool] = useState('div');
    const [elements, setElements] = useState([]);
    const [history, setHistory] = useState([]);
    const [redoStack, setRedoStack] = useState([]);
    const [currentDrawing, setCurrentDrawing] = useState(null);
    const [selectedIndices, setSelectedIndices] = useState([]);
    const [dragging, setDragging] = useState(false);
    const [resizing, setResizing] = useState(false);
    const [resizeHandle, setResizeHandle] = useState(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [clipboard, setClipboard] = useState([]);

    const saveToHistory = (currentElements) => {
        setHistory((prev) => [...prev, JSON.parse(JSON.stringify(currentElements))]);
        setRedoStack([]);
    };

    const copyElements = () => {
        if (selectedIndices.length === 0) return;
        const copied = selectedIndices.map(idx => {
            const el = elements[idx];
            if (!el) return null;
            if (el.type === 'group') {
                const childElements = el.children.map(childId =>
                    elements.find(e => e.id === childId)
                ).filter(child => child);
                return { ...el, children: childElements.map(c => c.id) };
            }
            return { ...el };
        }).filter(el => el);
        setClipboard(copied);
    };

    const pasteElements = () => {
        if (clipboard.length === 0) return;
        saveToHistory(elements);

        const newElements = clipboard.map(el => {
            const newId = Date.now() + Math.random();
            if (el.type === 'group') {
                const newChildIds = {};
                const newChildren = el.children.map(childId => {
                    const child = elements.find(e => e.id === childId) ||
                        clipboard.find(e => e.id === childId);
                    if (!child) return null;
                    const newChildId = Date.now() + Math.random();
                    newChildIds[childId] = newChildId;
                    return {
                        ...child,
                        id: newChildId,
                        x: child.x + 20,
                        y: child.y + 20,
                        points: child.points?.map(p => ({ x: p.x + 20, y: p.y + 20 }))
                    };
                }).filter(child => child);

                return {
                    ...el,
                    id: newId,
                    x: el.x + 20,
                    y: el.y + 20,
                    children: newChildren.map(c => c.id)
                };
            }
            return {
                ...el,
                id: newId,
                x: el.x + 20,
                y: el.y + 20,
                points: el.points?.map(p => ({ x: p.x + 20, y: p.y + 20 }))
            };
        });

        setElements(prev => [...prev, ...newElements]);
        setSelectedIndices(prev => [
            ...prev,
            ...Array.from(
                { length: newElements.length },
                (_, i) => elements.length + i
            )
        ]);
    };

    const undo = () => {
        if (history.length === 0) return;
        const lastState = history[history.length - 1];
        setRedoStack((prev) => [...prev, JSON.parse(JSON.stringify(elements))]);
        setElements(lastState);
        setHistory((prev) => prev.slice(0, -1));
        setSelectedIndices([]);
        setCurrentDrawing(null);
    };

    const redo = () => {
        if (redoStack.length === 0) return;
        const nextState = redoStack[redoStack.length - 1];
        setHistory((prev) => [...prev, JSON.parse(JSON.stringify(elements))]);
        setElements(nextState);
        setRedoStack((prev) => prev.slice(0, -1));
        setSelectedIndices([]);
        setCurrentDrawing(null);
    };

    const deleteSelectedElements = () => {
        if (selectedIndices.length === 0) return;
        saveToHistory(elements);
        setElements((prev) => prev.filter((_, idx) => !selectedIndices.includes(idx)));
        setSelectedIndices([]);
    };

    const getBoundingBox = (indices) => {
        if (indices.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

        indices.forEach((idx) => {
            const el = elements[idx];
            if (!el) return;
            if (el.type === 'group') {
                el.children.forEach((childId) => {
                    const child = elements.find((e) => e?.id === childId);
                    if (child) {
                        minX = Math.min(minX, child.x);
                        minY = Math.min(minY, child.y);
                        maxX = Math.max(maxX, child.x + child.width);
                        maxY = Math.max(maxY, child.y + child.height);
                    }
                });
            } else {
                minX = Math.min(minX, el.x);
                minY = Math.min(minY, el.y);
                maxX = Math.max(maxX, el.x + el.width);
                maxY = Math.max(maxY, el.y + el.height);
            }
        });

        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
        };
    };

    const groupSelectedElements = () => {
        if (selectedIndices.length < 2) return;
        saveToHistory(elements);
        const group = {
            id: Date.now(),
            type: 'group',
            children: selectedIndices.map((idx) => elements[idx]?.id).filter(id => id),
            ...getBoundingBox(selectedIndices),
        };
        setElements((prev) => [...prev, group]);
        setSelectedIndices([prev.length]);
    };

    const ungroupSelected = () => {
        if (selectedIndices.length !== 1) return;
        const groupIdx = selectedIndices[0];
        const group = elements[groupIdx];
        if (group?.type !== 'group') return;
        saveToHistory(elements);
        setElements((prev) => {
            const newElements = [...prev];
            newElements.splice(groupIdx, 1);
            return newElements;
        });
        setSelectedIndices([]);
    };

    function isNearHandle(px, py, hx, hy, size = HANDLE_SIZE) {
        const halfSize = size / 2;
        return (
            px >= hx - halfSize &&
            px <= hx + halfSize &&
            py >= hy - halfSize &&
            py <= hy + halfSize
        );
    }

    function getHandleAtPosition(x, y, box) {
        if (isNearHandle(x, y, box.x, box.y)) return 'nw';
        if (isNearHandle(x, y, box.x + box.width, y)) return 'ne';
        if (isNearHandle(x, y, box.x, box.y + box.height)) return 'sw';
        if (isNearHandle(x, y, box.x + box.width, box.y + box.height)) return 'se';
        return null;
    }

    function resizeElements(indices, handle, newX, newY) {
        const originalBox = getBoundingBox(indices);
        let { x, y, width, height } = originalBox;
        let nx = x;
        let ny = y;
        let nw = width;
        let nh = height;

        switch (handle) {
            case 'nw':
                nw = width + (x - newX);
                nh = height + (y - newY);
                nx = newX;
                ny = newY;
                break;
            case 'ne':
                nw = newX - x;
                nh = height + (y - newY);
                ny = newY;
                break;
            case 'sw':
                nw = width + (x - newX);
                nx = newX;
                nh = newY - y;
                break;
            case 'se':
                nw = newX - x;
                nh = newY - y;
                break;
        }

        if (nw < 10) nw = 10;
        if (nh < 10) nh = 10;

        const scaleX = nw / width;
        const scaleY = nh / height;

        return elements.map((el, idx) => {
            if (!indices.includes(idx) || !el) return el;
            if (el.type === 'group') {
                const newChildren = el.children.map((childId) => {
                    const child = elements.find((e) => e?.id === childId);
                    if (!child) return null;
                    const newChild = {
                        ...child,
                        x: nx + (child.x - x) * scaleX,
                        y: ny + (child.y - y) * scaleY,
                        width: child.width * scaleX,
                        height: child.height * scaleY,
                    };
                    if (child.type === 'freehand' && child.points) {
                        newChild.points = child.points.map((p) => ({
                            x: nx + (p.x - x) * scaleX,
                            y: ny + (p.y - y) * scaleY,
                        }));
                    }
                    return newChild;
                }).filter((c) => c);
                return {
                    ...el,
                    x: nx,
                    y: ny,
                    width: nw,
                    height: nh,
                    children: newChildren.map((c) => c.id),
                };
            }
            const newEl = {
                ...el,
                x: nx + (el.x - x) * scaleX,
                y: ny + (el.y - y) * scaleY,
                width: el.width * scaleX,
                height: el.height * scaleY,
            };
            if (el.type === 'freehand' && el.points) {
                newEl.points = el.points.map((p) => ({
                    x: nx + (p.x - x) * scaleX,
                    y: ny + (p.y - y) * scaleY,
                }));
            }
            return newEl;
        });
    }

    const handleLabelClick = (index, x, y) => {
        const el = elements[index];
        if (!el || el.type === 'freehand' || el.type === 'group') return false;
        const ctx = canvasRef.current.getContext('2d');
        ctx.font = '12px sans-serif';
        const label = el.customName || (el.type === 'input' && el.inputType ? `${el.type}:${el.inputType}` : el.type);
        const textMetrics = ctx.measureText(`<${label}>`);
        const textWidth = textMetrics.width;
        const textHeight = 12;
        const textX = el.x + 5;
        const textY = el.y + 15;
        if (
            x >= textX &&
            x <= textX + textWidth &&
            y >= textY - textHeight &&
            y <= textY
        ) {
            saveToHistory(elements);
            if (el.type === 'input') {
                const inputTypePrompt = prompt(
                    'Enter input type (e.g., text, date, file, email, tel, number, password, url):',
                    el.inputType || 'text'
                );
                if (inputTypePrompt && inputTypePrompt.trim()) {
                    const newInputType = inputTypePrompt.trim().toLowerCase();
                    const validInputTypes = [
                        'text', 'date', 'file', 'email', 'tel', 'number', 'password', 'url',
                        'search', 'time', 'datetime-local', 'month', 'week', 'color', 'range', 'checkbox', 'radio'
                    ];
                    if (!validInputTypes.includes(newInputType)) {
                        alert('Invalid input type. Using "text" as default.');
                        setElements((prev) => {
                            const newElements = [...prev];
                            newElements[index] = {
                                ...el,
                                inputType: 'text'
                            };
                            return newElements;
                        });
                    } else {
                        setElements((prev) => {
                            const newElements = [...prev];
                            newElements[index] = {
                                ...el,
                                inputType: newInputType
                            };
                            return newElements;
                        });
                    }
                }
            } else {
                const newName = prompt('Enter new name for the element:', el.customName || el.type);
                if (newName && newName.trim()) {
                    setElements((prev) => {
                        const newElements = [...prev];
                        newElements[index] = {
                            ...el,
                            customName: newName.trim()
                        };
                        return newElements;
                    });
                }
            }
            return true;
        }
        return false;
    };

    const handleMouseDown = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === 'draw') {
            if (selectedTool === 'freehand') {
                setCurrentDrawing({ points: [{ x, y }] });
            } else {
                setCurrentDrawing({ x0: x, y0: y, x1: x, y1: y });
            }
            setSelectedIndices([]);
            return;
        }

        const boundingBox = getBoundingBox(selectedIndices);
        if (selectedIndices.length > 0) {
            const handle = getHandleAtPosition(x, y, boundingBox);
            if (handle) {
                saveToHistory(elements);
                setResizing(true);
                setResizeHandle(handle);
                return;
            }
        }

        let hitIndex = null;
        for (let i = elements.length - 1; i >= 0; i--) {
            const el = elements[i];
            if (!el) continue;
            const box = el.type === 'group' ? getBoundingBox([i]) : el;
            if (x >= box.x && x <= box.x + box.width && y >= box.y && y <= box.y + box.height) {
                if (handleLabelClick(i, x, y)) {
                    return;
                }
                hitIndex = i;
                break;
            }
        }

        if (hitIndex !== null) {
            saveToHistory(elements);
            if (e.ctrlKey) {
                setSelectedIndices((prev) =>
                    prev.includes(hitIndex)
                        ? prev.filter((i) => i !== hitIndex)
                        : [...prev, hitIndex]
                );
            } else {
                setSelectedIndices([hitIndex]);
            }
            setDragging(true);
            const box = elements[hitIndex].type === 'group' ? getBoundingBox([hitIndex]) : elements[hitIndex];
            setDragOffset({ x: x - box.x, y: y - box.y });
            return;
        }

        setSelectedIndices([]);
    };

    const handleMouseMove = (e) => {
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (mode === 'draw') {
            if (!currentDrawing) return;
            if (selectedTool === 'freehand') {
                setCurrentDrawing((prev) => ({
                    points: [...prev.points, { x, y }],
                }));
            } else {
                setCurrentDrawing((prev) => ({ ...prev, x1: x, y1: y }));
            }
            return;
        }

        if (resizing && selectedIndices.length > 0) {
            setElements((prev) => resizeElements(selectedIndices, resizeHandle, x, y));
            return;
        }

        if (dragging && selectedIndices.length > 0) {
            const boundingBox = getBoundingBox(selectedIndices);
            const dx = x - dragOffset.x - boundingBox.x;
            const dy = y - dragOffset.y - boundingBox.y;
            setElements((prev) => {
                const copy = [...prev];
                selectedIndices.forEach((idx) => {
                    const el = copy[idx];
                    if (!el) return;
                    if (el.type === 'group') {
                        const newChildren = el.children.map((childId) => {
                            const child = elements.find((e) => e?.id === childId);
                            if (!child) return null;
                            const newChild = {
                                ...child,
                                x: child.x + dx,
                                y: child.y + dy,
                            };
                            if (child.type === 'freehand' && child.points) {
                                newChild.points = child.points.map((p) => ({
                                    x: p.x + dx,
                                    y: p.y + dy,
                                }));
                            }
                            return newChild;
                        }).filter((c) => c);
                        const childIndices = newChildren.map((child) =>
                            elements.findIndex((e) => e?.id === child.id)
                        ).filter((i) => i !== -1);
                        const newBoundingBox = getBoundingBox(childIndices);
                        copy[idx] = {
                            ...el,
                            x: newBoundingBox.x,
                            y: newBoundingBox.y,
                            width: newBoundingBox.width,
                            height: newBoundingBox.height,
                            children: newChildren.map((c) => c.id),
                        };
                        newChildren.forEach((child) => {
                            const childIdx = elements.findIndex((e) => e?.id === child.id);
                            if (childIdx !== -1) {
                                copy[childIdx] = child;
                            }
                        });
                    } else {
                        copy[idx] = {
                            ...el,
                            x: el.x + dx,
                            y: el.y + dy,
                        };
                        if (el.type === 'freehand' && el.points) {
                            copy[idx].points = el.points.map((p) => ({
                                x: p.x + dx,
                                y: p.y + dy,
                            }));
                        }
                    }
                });
                return copy;
            });
            return;
        }
    };

    const handleMouseUp = () => {
        if (mode === 'draw') {
            if (!currentDrawing) return;

            if (selectedTool === 'freehand') {
                const xs = currentDrawing.points.map((p) => p.x);
                const ys = currentDrawing.points.map((p) => p.y);
                const minX = Math.min(...xs);
                const maxX = Math.max(...xs);
                const minY = Math.min(...ys);
                const maxY = Math.max(...ys);

                if (maxX - minX < 5 || maxY - minY < 5) {
                    setCurrentDrawing(null);
                    return;
                }

                const newEl = {
                    id: Date.now(),
                    type: 'freehand',
                    x: minX,
                    y: minY,
                    width: maxX - minX,
                    height: maxY - minY,
                    points: currentDrawing.points,
                };
                saveToHistory(elements);
                setElements((prev) => [...prev, newEl]);
            } else {
                const { x0, y0, x1, y1 } = currentDrawing;
                const nx = Math.min(x0, x1);
                const ny = Math.min(y0, y1);
                const nw = Math.abs(x1 - x0);
                const nh = Math.abs(y1 - y0);

                if (nw < 5 || nh < 5) {
                    setCurrentDrawing(null);
                    return;
                }

                const newEl = {
                    id: Date.now(),
                    type: selectedTool,
                    x: nx,
                    y: ny,
                    width: nw,
                    height: nh,
                    inputType: selectedTool === 'input' ? 'text' : undefined
                };
                saveToHistory(elements);
                setElements((prev) => [...prev, newEl]);
            }
            setCurrentDrawing(null);
        }

        setDragging(false);
        setResizing(false);
        setResizeHandle(null);
    };

    const clearCanvas = () => {
        saveToHistory(elements);
        setElements([]);
        setCurrentDrawing(null);
        setSelectedIndices([]);
        setClipboard([]);
    };

    const downloadUI = () => {
        const uiState = {
            elements,
            history,
            redoStack,
            clipboard
        };
        const dataStr = JSON.stringify(uiState);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        const exportFileDefaultName = 'whiteboard-ui.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    };

    const uploadUI = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const uiState = JSON.parse(e.target.result);
                if (uiState.elements) {
                    saveToHistory(elements);
                    setElements(uiState.elements);
                    setHistory(uiState.history || []);
                    setRedoStack(uiState.redoStack || []);
                    setClipboard(uiState.clipboard || []);
                    setSelectedIndices([]);
                    setCurrentDrawing(null);
                } else {
                    alert('Invalid UI file format');
                }
            } catch (error) {
                alert('Error loading UI file');
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.ctrlKey && e.key === 'z') {
                e.preventDefault();
                undo();
            } else if (e.ctrlKey && e.key === 'y') {
                e.preventDefault();
                redo();
            } else if (e.key === 'Delete') {
                e.preventDefault();
                deleteSelectedElements();
            } else if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                if (e.shiftKey) {
                    ungroupSelected();
                } else {
                    groupSelectedElements();
                }
            } else if (e.ctrlKey && e.key === 'c') {
                e.preventDefault();
                copyElements();
            } else if (e.ctrlKey && e.key === 'v') {
                e.preventDefault();
                pasteElements();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [history, redoStack, elements, selectedIndices, clipboard, copyElements, pasteElements]);

    useEffect(() => {
        const updateCanvasSize = () => {
            if (!canvasRef.current) return;
            setCanvasSize({
                width: canvasRef.current.offsetWidth,
                height: canvasRef.current.offsetHeight,
            });
        };
        window.addEventListener('resize', updateCanvasSize);
        updateCanvasSize();
        return () => window.removeEventListener('resize', updateCanvasSize);
    }, []);

    useEffect(() => {
        if (!canvasRef.current) return;
        const ctx = canvasRef.current.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvasSize.width, canvasSize.height);

        elements.forEach((el, idx) => {
            if (!el) return;
            if (el.type === 'group') {
                el.children.forEach((childId) => {
                    const child = elements.find((e) => e?.id === childId);
                    if (!child) return;
                    ctx.fillStyle = 'rgba(0, 150, 255, 0.2)';
                    ctx.strokeStyle = selectedIndices.includes(idx) ? '#ff6600' : 'rgba(0, 150, 255, 1)';
                    ctx.lineWidth = 2;

                    if (child.type === 'freehand' && child.points) {
                        ctx.beginPath();
                        ctx.moveTo(child.points[0].x, child.points[0].y);
                        for (let i = 1; i < child.points.length; i++) {
                            ctx.lineTo(child.points[i].x, child.points[i].y);
                        }
                        ctx.stroke();
                    } else {
                        ctx.fillRect(child.x, child.y, child.width, child.height);
                        ctx.strokeRect(child.x, child.y, child.width, child.height);
                    }

                    if (child.type !== 'freehand') {
                        ctx.fillStyle = '#000';
                        ctx.font = '12px sans-serif';
                        const label = child.customName || (child.type === 'input' && child.inputType ? `${child.type}:${child.inputType}` : child.type);
                        ctx.fillText(`<${label}>`, child.x + 5, child.y + 15);
                    }
                });
            } else {
                ctx.fillStyle = 'rgba(0, 150, 255, 0.2)';
                ctx.strokeStyle = selectedIndices.includes(idx) ? '#ff6600' : 'rgba(0, 150, 255, 1)';
                ctx.lineWidth = 2;

                if (el.type === 'freehand' && el.points) {
                    ctx.beginPath();
                    ctx.moveTo(el.points[0].x, el.points[0].y);
                    for (let i = 1; i < el.points.length; i++) {
                        ctx.lineTo(el.points[i].x, el.points[i].y);
                    }
                    ctx.stroke();
                } else {
                    ctx.fillRect(el.x, el.y, el.width, el.height);
                    ctx.strokeRect(el.x, el.y, el.width, el.height);
                }

                if (el.type !== 'freehand') {
                    ctx.fillStyle = '#000';
                    ctx.font = '12px sans-serif';
                    const label = el.customName || (el.type === 'input' && el.inputType ? `${el.type}:${el.inputType}` : el.type);
                    ctx.fillText(`<${label}>`, el.x + 5, el.y + 15);
                }
            }

            if (selectedIndices.includes(idx)) {
                const box = el.type === 'group' ? getBoundingBox([idx]) : el;
                const handles = [
                    { x: box.x, y: box.y },
                    { x: box.x + box.width, y: box.y },
                    { x: box.x, y: box.y + box.height },
                    { x: box.x + box.width, y: box.y + box.height },
                ];
                ctx.fillStyle = '#ff6600';
                handles.forEach(({ x, y }) => {
                    ctx.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
                });
            }
        });

        if (selectedIndices.length > 1) {
            const box = getBoundingBox(selectedIndices);
            ctx.strokeStyle = '#ff6600';
            ctx.lineWidth = 2;
            ctx.strokeRect(box.x, box.y, box.width, box.height);
            const handles = [
                { x: box.x, y: box.y },
                { x: box.x + box.width, y: box.y },
                { x: box.x, y: box.y + box.height },
                { x: box.x + box.width, y: box.y + box.height },
            ];
            ctx.fillStyle = '#ff6600';
            handles.forEach(({ x, y }) => {
                ctx.fillRect(x - HANDLE_SIZE / 2, y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
            });
        }

        if (mode === 'draw' && currentDrawing) {
            ctx.strokeStyle = 'rgba(0,0,0,0.5)';
            ctx.lineWidth = 2;
            if (selectedTool === 'freehand') {
                const pts = currentDrawing.points;
                ctx.beginPath();
                ctx.moveTo(pts[0].x, pts[0].y);
                for (let i = 1; i < pts.length; i++) {
                    ctx.lineTo(pts[i].x, pts[i].y);
                }
                ctx.stroke();
            } else {
                const { x0, y0, x1, y1 } = currentDrawing;
                const nx = Math.min(x0, x1);
                const ny = Math.min(y0, y1);
                const nw = Math.abs(x1 - x0);
                const nh = Math.abs(y1 - y0);
                ctx.strokeRect(nx, ny, nw, nh);
            }
        }
    }, [elements, currentDrawing, selectedIndices, canvasSize, mode, selectedTool]);

    const handleGenerateCode = async () => {
        if (mode !== 'select') return;
        const response = await fetch('http://localhost:8000/generate-code', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ elements }),
        });

        if (response.ok) {
            const data = await response.json();
            const fullCode = `<style>\n${data.css}\n</style>\n${data.html}`;
            onGenerateCode(fullCode);
        } else {
            alert("Failed to generate code");
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div
                style={{
                    padding: '5px',
                    borderBottom: '1px solid #ccc',
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '10px',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                }}
            >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <button
                        onClick={() => {
                            setMode(mode === 'draw' ? 'select' : 'draw');
                            setSelectedIndices([]);
                            setCurrentDrawing(null);
                        }}
                        style={{
                            padding: '6px 12px',
                            background: mode === 'draw' ? '#28a745' : '#6c757d',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                        }}
                        title="Switch to Draw / Select mode"
                    >
                        {mode === 'draw' ? <FaMousePointer style={{ marginRight: '5px' }} /> : <FaPaintBrush style={{ marginRight: '5px' }} />}
                        {mode === 'draw' ? 'Switch to Select' : 'Switch to Draw'}
                    </button>

                    {mode === 'draw' && (
                        <>
                            {[
                                { tool: 'div', icon: <FaSquare /> },
                                { tool: 'button', icon: <FaHandPointer /> },
                                { tool: 'input', icon: <FaKeyboard /> },
                                { tool: 'freehand', icon: <FaPencilAlt /> },
                            ].map(({ tool, icon }) => (
                                <button
                                    key={tool}
                                    onClick={() => setSelectedTool(tool)}
                                    style={{
                                        padding: '6px 12px',
                                        background: selectedTool === tool ? '#007bff' : '#eee',
                                        color: selectedTool === tool ? '#fff' : '#000',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    <span style={{ marginRight: '5px' }}>{icon}</span>
                                    {tool}
                                </button>
                            ))}
                        </>
                    )}

                    {mode === 'select' && (
                        <>
                            <button
                                onClick={handleGenerateCode}
                                style={{
                                    padding: '6px 12px',
                                    background: '#17a2b8',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                title="Generate Code"
                            >
                                <FaCode style={{ marginRight: '5px' }} />
                                Generate Code
                            </button>

                            <button
                                onClick={downloadUI}
                                style={{
                                    padding: '6px 12px',
                                    background: '#ffc107',
                                    color: '#000',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                title="Download UI state"
                            >
                                <FaDownload style={{ marginRight: '5px' }} />
                                Download UI
                            </button>

                            <button
                                onClick={() => fileInputRef.current.click()}
                                style={{
                                    padding: '6px 12px',
                                    background: '#6610f2',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                }}
                                title="Upload UI state"
                            >
                                <FaUpload style={{ marginRight: '5px' }} />
                                Upload UI
                            </button>

                            <input
                                type="file"
                                ref={fileInputRef}
                                style={{ display: 'none' }}
                                accept=".json"
                                onChange={uploadUI}
                            />
                        </>
                    )}
                </div>

                <button
                    onClick={clearCanvas}
                    style={{
                        padding: '6px 12px',
                        background: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                    }}
                    title="Clear the Canvas"
                >
                    <FaTrash style={{ marginRight: '5px' }} />
                    Clear
                </button>
            </div>

            <div style={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
                <canvas
                    ref={canvasRef}
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={{ width: '100%', height: '100%', cursor: mode === 'draw' ? 'crosshair' : 'default' }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                />
            </div>
        </div>
    );
}

export default Whiteboard;
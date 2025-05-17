import { useState } from 'react';
import Whiteboard from './components/Whiteboard';
import CodeEditor from './components/CodeEditor';
import LivePreview from './components/LivePreview';

function App() {
    const [code, setCode] = useState('<div>Hello, World!</div>');

    const handleGenerateCode = (generatedCode) => {
        setCode(generatedCode);
    };

    return (
        <div
            style={{
                display: 'flex',
                height: '100dvh',
                width: '100%',
                padding: '10px',
                gap: '20px',
                flexDirection: 'row',
                boxSizing: 'border-box',
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    flex: 6,
                    border: '1px solid #ccc',
                    padding: '10px',
                    height: '100%',
                    overflow: 'hidden',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                <h3>Whiteboard</h3>
                <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                    <Whiteboard onGenerateCode={handleGenerateCode} />
                </div>
            </div>
            <div
                style={{
                    flex: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    height: '100%',
                    boxSizing: 'border-box',
                }}
            >
                <div
                    style={{
                        flex: 1,
                        border: '1px solid #ccc',
                        display: 'flex',
                        flexDirection: 'column',
                        padding: '10px',
                        overflow: 'hidden',
                        minHeight: 0,
                    }}
                >
                    <h3 style={{ margin: '4px' }}>Code Editor</h3>
                    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <CodeEditor code={code} onCodeChange={setCode} />
                    </div>
                </div>
                <div
                    style={{
                        flex: 1,
                        border: '1px solid #ccc',
                        padding: '10px',
                        display: 'flex',
                        flexDirection: 'column',
                        minHeight: 0,
                    }}
                >
                    <h3 style={{ margin: '4px 0' }}>Live Preview</h3>
                    <div style={{ flex: 1, overflow: 'auto', minHeight: 0 }}>
                        <LivePreview code={code} />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
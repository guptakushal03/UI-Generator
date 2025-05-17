import Editor from "@monaco-editor/react";
import { useRef } from "react";
import prettier from "prettier";
import parserHtml from "prettier/parser-html";

function CodeEditor({ code, onCodeChange }) {
    const editorRef = useRef(null);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        editor.focus();
    };

    const handleCopy = () => {
        if (editorRef.current) {
            editorRef.current.trigger('keyboard', 'editor.action.clipboardCopyAction');
        }
    };

    const handlePaste = () => {
        if (editorRef.current) {
            editorRef.current.trigger('keyboard', 'editor.action.clipboardPasteAction');
        }
    };

    const handleDownload = () => {
        if (editorRef.current) {
            const rawCode = editorRef.current.getValue() || '';
            let formattedCode = rawCode;

            try {
                const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>A Project By KG</title>
    <style></style>
</head>
<body>
${rawCode}
</body>
</html>
                `;

                if (prettier && parserHtml) {
                    formattedCode = prettier.format(fullHtml, {
                        parser: "html",
                        plugins: [parserHtml],
                        tabWidth: 2,
                        useTabs: false,
                        printWidth: 80,
                    });
                } else {
                    console.warn('Prettier or parser-html not available, downloading unformatted code');
                    formattedCode = fullHtml;
                }
            } catch (error) {
                console.error('Error formatting code with Prettier:', error);
                console.warn('Downloading unformatted code as fallback');
                formattedCode = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Page</title>
    <style></style>
</head>
<body>
${rawCode}
</body>
</html>
                `;
            }

            const blob = new Blob([formattedCode], { type: 'text/html' });
            const url = URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = 'code.html';
            document.body.appendChild(link);
            link.click();

            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }
    };

    return (
        <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Toolbar */}
            <div style={{ padding: '4px', background: '#1e1e1e', display: 'flex', gap: '10px' }}>
                <button onClick={handleCopy} style={{ padding: '4px 10px', cursor: 'pointer' }}>Copy</button>
                <button onClick={handleDownload} style={{ padding: '4px 10px', cursor: 'pointer' }}>Download</button>
            </div>

            {/* Code Editor */}
            <Editor
                height="100%"
                language="html"
                value={code}
                onChange={(value) => onCodeChange(value || '')}
                theme="vs-dark"
                onMount={handleEditorDidMount}
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                }}
            />
        </div>
    );
}

export default CodeEditor;
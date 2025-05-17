function LivePreview({ code }) {
    return (
        <div
            style={{
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                display: 'flex',
            }}
        >
            <iframe
                title="Live Preview"
                style={{
                    width: '100%',
                    height: '100%',
                    border: 'none',
                    zoom: 0.5,
                }}
                srcDoc={code}
            />
        </div>
    );
}

export default LivePreview;
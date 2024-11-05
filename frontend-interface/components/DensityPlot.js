export default function DensityPlot({ plotImageData }) {
    if (!plotImageData) return null;
    
    return (
        <div style={{ margin: '20px', border: '1px solid #ccc' }}>
            <img 
                src={`data:image/png;base64,${plotImageData}`} 
                alt="Density Matrix Plot"
                style={{ 
                    display: 'block',
                    width: '100%',
                    maxWidth: '600px', // Increased from 400px
                    height: 'auto'     // Let height adjust automatically
                }}
                onLoad={() => console.log("Image loaded successfully")}
                onError={(e) => console.error("Image load error:", e)}
            />
        </div>
    );
}
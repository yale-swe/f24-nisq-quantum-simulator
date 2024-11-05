export default function DensityPlot({ plotImageData }) {
    if (!plotImageData) return null;
    
    return (
        <img 
            src={`data:image/png;base64,${plotImageData}`} 
            alt="Density Matrix Plot"
            style={{ width: '400px', height: '400px' }}
        />
    );
}
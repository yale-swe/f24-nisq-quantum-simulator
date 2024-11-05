export default function DensityPlot({ plotImageData }) {
    console.log("DensityPlot received:", plotImageData);
    return (
        <img 
            src={`data:image/png;base64,${plotImageData || ''}`} 
            alt="Density Matrix Plot"
            style={{ width: '400px', height: '400px' }}
        />
    );
}
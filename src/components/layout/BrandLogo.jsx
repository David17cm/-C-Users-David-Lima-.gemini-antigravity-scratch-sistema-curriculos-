export default function BrandLogo({ size = 24, style = {} }) {
    return (
        <img 
            src="/logo-norte.png" 
            alt="Norte Empregos" 
            style={{ 
                width: `${size}px`, 
                height: `${size}px`, 
                borderRadius: '50%', 
                objectFit: 'cover',
                border: '1px solid rgba(255,255,255,0.1)',
                display: 'block',
                ...style 
            }} 
        />
    );
}

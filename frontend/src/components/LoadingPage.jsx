import LOGO2 from '../assets/LOGO-2.png';

export const LoadingPage = ({ fadeOut = false }) => {
  const handleImageError = (e) => {
    console.warn('Failed to load HYDRA logo');
    e.target.style.display = 'none';
  };

  return (
    <div 
      className={`w-screen h-screen flex items-center justify-center bg-[linear-gradient(108deg,rgba(61,8,8,1)_0%,rgba(65,11,11,1)_24%,rgba(84,8,8,1)_41%,rgba(89,11,11,1)_51%,rgba(82,10,11,1)_62%,rgba(53,14,15,1)_81%,rgba(50,14,14,1)_91%,rgba(38,16,17,1)_100%)] transition-opacity duration-[800ms] ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center justify-center gap-6">
        <img
          src={LOGO2}
          alt="Hydra Logo - Three-headed dragon representing the anti-corruption intelligence platform"
          className="w-[258px] h-[273px] object-contain animate-fade-in opacity-0"
          style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}
          onError={handleImageError}
        />
        <h1 
          className="font-play font-bold text-[80px] tracking-[8px] text-white animate-fade-up opacity-0"
          style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}
        >
          HYDRA
        </h1>
        <p 
          className="font-inter font-bold text-[23px] tracking-[2.3px] text-white animate-fade-up opacity-0"
          style={{ animationDelay: '1s', animationFillMode: 'forwards' }}
        >
          Anti - Corruption Intelligence Platform
        </p>
      </div>
    </div>
  );
};

import { useTracker } from '../../hooks/useTracker';

// Wrapper invisível para ativar o hook de tracking na raiz das rotas
export default function TrackerWrapper() {
    useTracker();
    return null;
}

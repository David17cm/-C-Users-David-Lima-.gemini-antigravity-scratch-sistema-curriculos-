const API_URL = import.meta.env.PROD ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:3001');

export const api = {
    async post(endpoint, data) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro na requisição ao backend');
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Erro em POST ${endpoint}:`, error);
            throw error;
        }
    },
    
    async get(endpoint) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`);
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro na requisição ao backend');
            }
            return await response.json();
        } catch (error) {
            console.error(`Erro em GET ${endpoint}:`, error);
            throw error;
        }
    }
};

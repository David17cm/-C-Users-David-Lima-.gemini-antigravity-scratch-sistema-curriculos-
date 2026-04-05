/**
 * NORTE MATCHING ENGINE (v2.0)
 * Motor centralizado de inteligência e afinidade do Norte Empregos.
 */

// --- HELPERS E UTILITÁRIOS ---

/**
 * Normaliza textos removendo acentos e convertendo para minúsculas.
 */
export const normalizeText = (txt) => {
    if (!txt) return "";
    return txt.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

/**
 * Calcula a idade a partir de uma data de nascimento (YYYY-MM-DD).
 */
export const calculateAge = (dt) => {
    if (!dt) return null;
    const hoje = new Date();
    const n = new Date(dt);
    let idade = hoje.getFullYear() - n.getFullYear();
    const m = hoje.getMonth() - n.getMonth();
    if (m < 0 || (m === 0 && hoje.getDate() < n.getDate())) idade--;
    return idade;
};

/**
 * Verifica se o currículo possui os campos mínimos preenchidos.
 */
export const isProfileComplete = (cv) => {
    if (!cv) return false;
    const temResumo = !!cv.resumo && cv.resumo.trim().length > 10;
    const temExp = Array.isArray(cv.experiencias) && cv.experiencias.length > 0;
    const temForm = (Array.isArray(cv.formacoes) && cv.formacoes.length > 0) || (cv.ensino_medio?.status);
    const temHabilidades = Array.isArray(cv.habilidades) && cv.habilidades.length > 0;
    const temContato = !!cv.telefone && !!cv.cidade;
    
    return temResumo && (temExp || cv.primeiro_emprego) && temForm && temHabilidades && temContato;
};

/**
 * Analisa o JSON de Perfil DISC e retorna a letra dominante (D, I, S, C).
 */
export const getDiscDominant = (rawDisc) => {
    if (!rawDisc) return null;
    try {
        const discData = typeof rawDisc === 'string' && rawDisc.startsWith('{') 
            ? JSON.parse(rawDisc) 
            : (typeof rawDisc === 'object' ? rawDisc : null);
            
        if (discData && Object.keys(discData).length > 0) {
            const sorted = Object.entries(discData).sort((a,b) => b[1] - a[1]);
            const dominanteStr = sorted[0][0];
            
            const mapping = {
                'Executor': 'D',
                'Comunicador': 'I',
                'Planejador': 'S',
                'Analista': 'C'
            };
            return mapping[dominanteStr] || null;
        }
    } catch {
        return null;
    }
    return null;
};

// --- MOTOR DE CÁLCULO (CORE) ---

/**
 * Calcula o score de afinidade entre um candidato e um conjunto de requisitos.
 * @param {Object} candidate Dados do candidato/currículo.
 * @param {Object} requirements Filtros ou Requisitos da Vaga.
 * @param {String} mode 'vaga' ou 'busca'.
 */
export const calculateScore = (candidate, requirements, mode = 'vaga') => {
    if (!candidate) return { score: 0, breakdown: [] };

    let earnedPoints = 0;
    let totalWeight = 0;
    const breakdown = [];

    // Normalização dos textos do candidato para facilitar a busca profunda (Deep Search)
    const cvText = {
        habilidades: (candidate.habilidades || []).map(h => normalizeText(h)),
        resumo: normalizeText(candidate.resumo || ''),
        experiencias: (candidate.experiencias || []).map(exp => ({
            cargo: normalizeText(exp.cargo || ''),
            desc: normalizeText(exp.atribuicoes || exp.descricao || '')
        })),
        cursos: (candidate.cursos_prof || []).map(c => normalizeText(c)),
        formacao: (candidate.formacoes || []).map(f => normalizeText(f.curso || ''))
    };

    // --- MODO VAGA (Matching de Inscrição) ---
    if (mode === 'vaga') {
        const obrigatorios = Array.isArray(requirements.requisitos_obrigatorios) ? requirements.requisitos_obrigatorios : [];
        const desejaveis = Array.isArray(requirements.requisitos_desejaveis) ? requirements.requisitos_desejaveis : [];

        if (obrigatorios.length === 0 && desejaveis.length === 0) {
            return { score: 20, breakdown: ['Score base por candidatura'] };
        }

        // Lógica de Pontos com Deep Search e Pesos por Campo
        const checkTerm = (term) => {
            const t = normalizeText(term);
            let fieldWeight = 0;
            let foundIn = '';

            // 1. Match no Cargo (Peso 1.2)
            if (cvText.experiencias.some(e => e.cargo.includes(t))) {
                fieldWeight = 1.2; foundIn = 'Cargo';
            } 
            // 2. Match nas Habilidades (Peso 1.0)
            else if (cvText.habilidades.some(h => h.includes(t))) {
                fieldWeight = 1.0; foundIn = 'Habilidades';
            }
            // 3. Match nos Cursos/Formação (Peso 0.9)
            else if (cvText.cursos.some(c => c.includes(t)) || cvText.formacao.some(f => f.includes(t))) {
                fieldWeight = 0.9; foundIn = 'Qualificação';
            }
            // 4. Match no Resumo (Peso 0.8)
            else if (cvText.resumo.includes(t)) {
                fieldWeight = 0.8; foundIn = 'Resumo';
            }
            // 5. Match na Descrição de Exp (Peso 0.8)
            else if (cvText.experiencias.some(e => e.desc.includes(t))) {
                fieldWeight = 0.8; foundIn = 'Exp. Anterior';
            }

            return { found: fieldWeight > 0, weight: fieldWeight, location: foundIn };
        };

        obrigatorios.forEach(req => {
            totalWeight += 10;
            const result = checkTerm(req);
            if (result.found) {
                const points = 10 * result.weight;
                earnedPoints += points;
                breakdown.push(`✅ [Obrigatório] ${req} (+${points.toFixed(0)})`);
            }
        });

        desejaveis.forEach(req => {
            totalWeight += 5;
            const result = checkTerm(req);
            if (result.found) {
                const points = 5 * result.weight;
                earnedPoints += points;
                breakdown.push(`⭐ [Desejável] ${req} (+${points.toFixed(0)})`);
            }
        });

        // Penalidade de Gênero (Mantendo lógica solicitada)
        if (requirements.preferencia_genero && requirements.preferencia_genero !== 'todos') {
            if (candidate.genero && candidate.genero.toLowerCase() !== requirements.preferencia_genero) {
                earnedPoints = Math.max(0, earnedPoints - (totalWeight * 0.5));
                breakdown.push(`⚠️ Divergência de Gênero (-50%)`);
            }
        }

        let finalScore = totalWeight > 0 ? (earnedPoints / totalWeight) * 100 : 0;

        // Bônus de Recência e Integridade (Unificado)
        const doisAnosAtras = new Date();
        doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
        const temExpRecente = (candidate.experiencias || []).some(exp => {
            if (exp.atual) return true;
            if (exp.ano_fim) {
                const dataFim = new Date(parseInt(exp.ano_fim), (parseInt(exp.mes_fim) || 1) - 1, 1);
                return dataFim >= doisAnosAtras;
            }
            return false;
        });

        if (temExpRecente) {
            finalScore += 5;
            breakdown.push(`📅 Ativo no Mercado (+5%)`);
        }
        if (isProfileComplete(candidate)) {
            finalScore += 5;
            breakdown.push(`💎 Perfil Completo (+5%)`);
        }

        return { score: Math.min(100, Math.round(finalScore)), breakdown };
    }

    // --- MODO BUSCA (Banco de Talentos) ---
    if (mode === 'busca') {
        const PESOS_BUSCA = {
            experiencia: 40,
            habilidades: 25,
            disc: 20,
            localizacao: 10,
            extra: 5
        };

        // Palavras-Chave (40 pts) - Deep Search ativado
        if (requirements.palavrasChave) {
            const kwSet = requirements.palavrasChave.split(',').map(s => normalizeText(s.trim())).filter(s => s.length > 0);
            if (kwSet.length > 0) {
                totalWeight += PESOS_BUSCA.experiencia;
                let kwPoints = 0;
                kwSet.forEach(kw => {
                    // Check em TUDO (Nova Inteligência)
                    if (cvText.experiencias.some(e => e.cargo.includes(kw))) kwPoints += 1.2;
                    else if (cvText.habilidades.some(h => h.includes(kw))) kwPoints += 1.0;
                    else if (cvText.cursos.some(c => c.includes(kw)) || cvText.formacao.some(f => f.includes(kw))) kwPoints += 0.9;
                    else if (cvText.resumo.includes(kw) || cvText.experiencias.some(e => e.desc.includes(kw))) kwPoints += 0.8;
                });
                const finalKwScore = Math.min(1, (kwPoints / kwSet.length)) * PESOS_BUSCA.experiencia;
                earnedPoints += finalKwScore;
                if (finalKwScore > 0) breakdown.push(`🔍 Palavras-chave: ${finalKwScore.toFixed(0)} pts`);
            }
        }

        // Habilidades/Cursos (25 pts)
        const cursosAtivos = (requirements.cursos || []).filter(c => c !== '');
        const habFiltro = requirements.habilidade ? requirements.habilidade.split(',').map(s => normalizeText(s.trim())).filter(s => s !== '') : [];
        
        if (habFiltro.length > 0 || cursosAtivos.length > 0) {
            totalWeight += PESOS_BUSCA.habilidades;
            let habPoints = 0;
            
            // Habilidades (15 pts)
            if (habFiltro.length > 0) {
                let matches = 0;
                habFiltro.forEach(sb => { if (cvText.habilidades.some(hc => hc.includes(sb))) matches++; });
                habPoints += (matches / habFiltro.length) * 15;
            }
            // Cursos (10 pts)
            if (cursosAtivos.length > 0) {
                let cursoMatches = 0;
                cursosAtivos.forEach(c => { if ((candidate.cursos_prof || []).includes(c)) cursoMatches++; });
                habPoints += (cursoMatches / cursosAtivos.length) * 10;
            }
            earnedPoints += habPoints;
            if (habPoints > 0) breakdown.push(`🛠️ Habilidades/Cursos: ${habPoints.toFixed(0)} pts`);
        }

        // Perfil DISC (20 pts)
        if (requirements.perfilDisc) {
            totalWeight += PESOS_BUSCA.disc;
            if (getDiscDominant(candidate.perfil_disc) === requirements.perfilDisc) {
                earnedPoints += PESOS_BUSCA.disc;
                breakdown.push(`🚀 Perfil DISC Ideal (+20)`);
            }
        }

        // Localização (10 pts)
        if (requirements.cidade) {
            totalWeight += PESOS_BUSCA.localizacao;
            if (normalizeText(candidate.cidade).includes(normalizeText(requirements.cidade))) {
                earnedPoints += PESOS_BUSCA.localizacao;
                breakdown.push(`📍 Localização: ${candidate.cidade} (+10)`);
            }
        }

        // Extras (5 pts)
        if (requirements.statusCurriculo === 'completo' || requirements.ensinoSuperior || requirements.ensinoMedio) {
            totalWeight += PESOS_BUSCA.extra;
            let extras = 0;
            if (isProfileComplete(candidate)) extras += 2;
            // Simplificação para o exemplo: (Adicionar mais lógica se necessário)
            earnedPoints += extras;
            if (extras > 0) breakdown.push(`✨ Qualidade do Perfil (+${extras})`);
        }

        let finalScore = totalWeight > 0 ? (earnedPoints / totalWeight) * 100 : 0;

        // --- BÔNUS DE INTELIGÊNCIA (Fase 3) ---
        
        // 1. Bônus de Recência (+5% se teve experiência nos últimos 2 anos)
        const doisAnosAtras = new Date();
        doisAnosAtras.setFullYear(doisAnosAtras.getFullYear() - 2);
        
        const temExpRecente = (candidate.experiencias || []).some(exp => {
            if (exp.atual) return true;
            if (exp.ano_fim) {
                const dataFim = new Date(parseInt(exp.ano_fim), (parseInt(exp.mes_fim) || 1) - 1, 1);
                return dataFim >= doisAnosAtras;
            }
            return false;
        });

        if (temExpRecente) {
            finalScore += 5;
            breakdown.push(`📅 Ativo no Mercado (+5%)`);
        }

        // 2. Bônus de Integridade (+5% se perfil 100% completo)
        if (isProfileComplete(candidate)) {
            finalScore += 5;
            breakdown.push(`💎 Perfil Completo (+5%)`);
        }

        return { score: Math.min(100, Math.round(finalScore)), breakdown };
    }

    return { score: 0, breakdown: [] };
};

/**
 * Analisa os requisitos de uma vaga e identifica quais o candidato possui e quais faltam.
 * Utilizado para o Orientador Inteligente no momento da candidatura.
 */
export const getRequirementAnalysis = (candidate, requirements) => {
    if (!candidate || !requirements) return { missing: [], found: [] };

    // Normalização (Reutilizando a mesma lógica do motor principal)
    const cvText = {
        habilidades: (candidate.habilidades || []).map(h => normalizeText(h)),
        resumo: normalizeText(candidate.resumo || ''),
        experiencias: (candidate.experiencias || []).map(exp => ({
            cargo: normalizeText(exp.cargo || ''),
            desc: normalizeText(exp.atribuicoes || exp.descricao || '')
        })),
        cursos: (candidate.cursos_prof || []).map(c => normalizeText(c)),
        formacao: (candidate.formacoes || []).map(f => normalizeText(f.curso || ''))
    };

    const checkTerm = (term) => {
        const t = normalizeText(term);
        // Busca em todos os campos (Cargo, Habilidades, Cursos, Resumo, Descrição Exp)
        const inCargo = cvText.experiencias.some(e => e.cargo.includes(t));
        const inHabs = cvText.habilidades.some(h => h.includes(t));
        const inCursos = cvText.cursos.some(c => c.includes(t)) || cvText.formacao.some(f => f.includes(t));
        const inResumo = cvText.resumo.includes(t);
        const inDesc = cvText.experiencias.some(e => e.desc.includes(t));

        return inCargo || inHabs || inCursos || inResumo || inDesc;
    };

    const obrigatorios = Array.isArray(requirements.requisitos_obrigatorios) ? requirements.requisitos_obrigatorios : [];
    const desejaveis = Array.isArray(requirements.requisitos_desejaveis) ? requirements.requisitos_desejaveis : [];

    const found = [];
    const missing = [];

    [...obrigatorios, ...desejaveis].forEach(req => {
        if (checkTerm(req)) {
            found.push(req);
        } else {
            missing.push(req);
        }
    });

    return { found, missing };
};

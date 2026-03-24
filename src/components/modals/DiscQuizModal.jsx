import React, { useState } from 'react';
import { X, CheckCircle, Brain, ArrowRight, ArrowLeft } from 'lucide-react';

const QUESTIONS = [
  {
    question: "Em um projeto de equipe, qual sua prioridade?",
    options: [
      { text: "Entregar resultados rápidos e bater metas.", type: "Executor" },
      { text: "Garantir que todos estejam motivados e integrados.", type: "Comunicador" },
      { text: "Manter o cronograma organizado e sem conflitos.", type: "Planejador" },
      { text: "Garantir que cada detalhe técnico esteja perfeito.", type: "Analista" }
    ]
  },
  {
    question: "Como você reage sob pressão intensa?",
    options: [
      { text: "Tomo o controle e decido o que deve ser feito.", type: "Executor" },
      { text: "Busco apoio nas pessoas e tento aliviar o clima.", type: "Comunicador" },
      { text: "Mantenho a calma e sigo o plano estabelecido.", type: "Planejador" },
      { text: "Analiso todos os dados antes de agir com precisão.", type: "Analista" }
    ]
  },
  {
    question: "Qual característica melhor descreve você no trabalho?",
    options: [
      { text: "Determinado e competitivo.", type: "Executor" },
      { text: "Persuasivo e entusiasmado.", type: "Comunicador" },
      { text: "Paciente e bom ouvinte.", type: "Planejador" },
      { text: "Disciplinado e cauteloso.", type: "Analista" }
    ]
  },
  {
    question: "O que mais te desmotiva em uma tarefa?",
    options: [
      { text: "Falta de autonomia ou progresso lento.", type: "Executor" },
      { text: "Falta de interação social ou rotina isolada.", type: "Comunicador" },
      { text: "Mudanças bruscas e falta de harmonia.", type: "Planejador" },
      { text: "Desorganização ou falta de padrões lógicos.", type: "Analista" }
    ]
  },
  {
    question: "Como você prefere receber feedbacks?",
    options: [
      { text: "Direto ao ponto, com foco em resultados.", type: "Executor" },
      { text: "De forma amigável e valorizando meu empenho.", type: "Comunicador" },
      { text: "Com tato, sem críticas agressivas.", type: "Planejador" },
      { text: "Com evidências claras e dados fundamentados.", type: "Analista" }
    ]
  },
  {
    question: "Ao enfrentar um problema novo, você...",
    options: [
      { text: "Age logo para resolvê-lo o quanto antes.", type: "Executor" },
      { text: "Conversa com outros para ter novas ideias.", type: "Comunicador" },
      { text: "Avalia o impacto na rotina da equipe.", type: "Planejador" },
      { text: "Estuda o problema a fundo para entender a causa.", type: "Analista" }
    ]
  },
  {
    question: "Qual ambiente de trabalho você prefere?",
    options: [
      { text: "Desafiador e com metas claras de crescimento.", type: "Executor" },
      { text: "Dinâmico, alegre e com muita troca de ideias.", type: "Comunicador" },
      { text: "Previsível, seguro e acolhedor.", type: "Planejador" },
      { text: "Sério, focado em processos e alta qualidade.", type: "Analista" }
    ]
  },
  {
    question: "Como você lida com mudanças?",
    options: [
      { text: "Vejo como oportunidade de ganhar mercado/espaço.", type: "Executor" },
      { text: "Fico animado com a novidade e novas conexões.", type: "Comunicador" },
      { text: "Sinto certa resistência se mudar o que já funciona.", type: "Planejador" },
      { text: "Questiono os motivos e analiso os riscos.", type: "Analista" }
    ]
  },
  {
    question: "Sua principal força é...",
    options: [
      { text: "A capacidade de agir e fazer acontecer.", type: "Executor" },
      { text: "O carisma e a facilidade de comunicação.", type: "Comunicador" },
      { text: "A lealdade e o espírito de equipe.", type: "Planejador" },
      { text: "A organização e o pensamento crítico.", type: "Analista" }
    ]
  },
  {
    question: "Qual o seu maior medo profissional?",
    options: [
      { text: "Falhar ou ser visto como incapaz.", type: "Executor" },
      { text: "Ser rejeitado ou ignorado pelas pessoas.", type: "Comunicador" },
      { text: "Perder a estabilidade ou enfrentar conflitos.", type: "Planejador" },
      { text: "Cometer erros por falta de atenção aos detalhes.", type: "Analista" }
    ]
  }
];

export default function DiscQuizModal({ isOpen, onClose, onFinish }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState([]);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  const handleSelect = (type) => {
    const newAnswers = [...answers];
    newAnswers[currentStep] = type;
    setAnswers(newAnswers);

    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      calculateResult(newAnswers);
    }
  };

  const calculateResult = (finalAnswers) => {
    const counts = { Executor: 0, Comunicador: 0, Planejador: 0, Analista: 0 };
    finalAnswers.forEach(type => {
      counts[type] = (counts[type] || 0) + 1;
    });

    // Converter para porcentagem
    const total = finalAnswers.length;
    const percentages = {
      Executor: Math.round((counts.Executor / total) * 100),
      Comunicador: Math.round((counts.Comunicador / total) * 100),
      Planejador: Math.round((counts.Planejador / total) * 100),
      Analista: Math.round((counts.Analista / total) * 100)
    };

    setIsFinished(true);
    setTimeout(() => {
        onFinish(percentages);
        reset();
    }, 2000);
  };

  const reset = () => {
    setCurrentStep(0);
    setAnswers([]);
    setIsFinished(false);
  };

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, padding: '1rem'
    }}>
      <div className="glass-panel" style={{ maxWidth: '600px', width: '100%', padding: '2.5rem', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: '20px', right: '20px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
          <X size={24} />
        </button>

        {!isFinished ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '1.5rem', color: 'var(--neon-purple)' }}>
              <Brain size={28} />
              <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 900 }}>TESTE COMPORTAMENTAL</h2>
            </div>

            <div style={{ height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginBottom: '2rem', overflow: 'hidden' }}>
              <div style={{ width: `${progress}%`, height: '100%', background: 'var(--neon-purple)', transition: 'width 0.3s ease' }} />
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>Questão {currentStep + 1} de {QUESTIONS.length}</p>
            <h3 style={{ fontSize: '1.3rem', marginBottom: '2rem', lineHeight: '1.4' }}>{QUESTIONS[currentStep].question}</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {QUESTIONS[currentStep].options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => handleSelect(opt.type)}
                  className="neon-button secondary"
                  style={{
                    textAlign: 'left',
                    padding: '16px 20px',
                    borderColor: 'rgba(255,255,255,0.1)',
                    justifyContent: 'flex-start',
                    width: '100%',
                    height: 'auto'
                  }}
                >
                  {opt.text}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2.5rem', alignItems: 'center' }}>
                <button 
                  disabled={currentStep === 0}
                  onClick={() => setCurrentStep(currentStep - 1)}
                  style={{ background: 'none', border: 'none', color: currentStep === 0 ? 'transparent' : 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <ArrowLeft size={18} /> Voltar
                </button>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', opacity: 0.6 }}>O resultado será calculado ao final</span>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '3rem 0', animation: 'fadeIn 0.5s ease' }}>
            <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%', marginBottom: '1.5rem', color: '#22c55e' }}>
              <CheckCircle size={60} />
            </div>
            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>TESTE CONCLUÍDO!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Estamos calculando as porcentagens do seu perfil...</p>
          </div>
        )}
      </div>
    </div>
  );
}

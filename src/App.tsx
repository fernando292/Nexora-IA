import { useEffect, useState } from 'react'
import NexoraLogo from './components/branding/NexoraLogo'
import './App.css'

function App() {
  const [activeSection, setActiveSection] = useState('inicio')

  useEffect(() => {
    const sections = [
      'inicio',
      'producto',
      'tecnologia',
      'conectores',
      'autorizacion',
      'builder',
    ]

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]

        if (visible) {
          setActiveSection(visible.target.id)
        }
      },
      {
        rootMargin: '-25% 0px -55% 0px',
        threshold: [0.1, 0.25, 0.5, 0.75],
      },
    )

    sections.forEach((id) => {
      const section = document.getElementById(id)

      if (section) {
        observer.observe(section)
      }
    })

    return () => observer.disconnect()
  }, [])

  return (
    <main className="landing">
      <div className="section-nav" aria-label="Navegación de secciones">
        {[
          ['inicio', 'Inicio'],
          ['producto', 'Producto'],
          ['tecnologia', 'Tecnología'],
          ['conectores', 'Conectores'],
          ['autorizacion', 'Autorización'],
          ['builder', 'Builder'],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            className={`section-nav-item ${
              activeSection === id ? 'active' : ''
            }`}
            aria-label={label}
          >
            <span className="section-nav-label">{label}</span>
            <span className="section-nav-dot" />
          </a>
        ))}
      </div>

      <nav className="navbar">
        <a className="brand" href="#inicio" aria-label="Nexora">
          <NexoraLogo size={42} />
        </a>

        <div className="nav-links">
          <a href="#producto">Producto</a>
          <a href="#tecnologia">Tecnología</a>
          <a href="#conectores">Conectores</a>
        </div>

        <div className="nav-actions">
          <button className="nav-login">Iniciar sesión</button>
          <button className="nav-cta">Comenzar</button>
        </div>
      </nav>

      <section className="hero" id="inicio">
        <div className="hero-glow hero-glow-one" />
        <div className="hero-glow hero-glow-two" />

        <div className="hero-content">
          <div className="hero-badge">
            <span className="status-dot" />
            Inteligencia contextual
          </div>

          <h1>
            La IA que
            <span> entiende tu contexto.</span>
          </h1>

          <p className="hero-description">
            Habla con ella como hablarías con una persona.
            Nexora entiende, recuerda y actúa cuando tú lo autorizas.
          </p>

          <div className="hero-actions">
            <button className="primary-button">
              Comenzar
              <span>→</span>
            </button>

            <button className="secondary-button">
              Explorar Nexora
            </button>
          </div>
        </div>

        <div className="hero-orbit">
          <div className="orbit orbit-one" />
          <div className="orbit orbit-two" />
          <div className="orbit orbit-three" />

          <div className="core-glow" />

          <div className="hero-logo">
            <NexoraLogo size={112} showText={false} />
          </div>

          <span className="particle particle-one" />
          <span className="particle particle-two" />
          <span className="particle particle-three" />
          <span className="particle particle-four" />
          <span className="particle particle-five" />
        </div>
      </section>

      <section className="intro-section" id="producto">
        <span className="section-label">NEXORA</span>

        <h2>
          No necesitas aprender
          <span>a hablar con una IA.</span>
        </h2>

        <p>
          Nexora está diseñada para entender cómo hablas realmente:
          preguntas incompletas, errores, contexto y conversaciones naturales.
        </p>

        <div className="understanding-panel">
          <div className="conversation-column">
            <div className="conversation-label">Tú</div>

            <div className="message user-message">
              nexora qien tengo q cobrar oy
            </div>

            <div className="message user-message muted-message">
              hoy a quien le cobro?
            </div>

            <div className="message user-message">
              quien tiene mas plata pendiente
            </div>
          </div>

          <div className="understanding-line">
            <div className="line-dot" />
            <div className="line-track" />
            <div className="line-dot" />
          </div>

          <div className="conversation-column nexora-column">
            <div className="conversation-label">
              <span className="mini-status" />
              Nexora
            </div>

            <div className="message ai-message">
              Entendí que quieres saber a quién debes cobrar hoy.
            </div>

            <div className="message ai-message">
              Revisando tu contexto...
              <span className="thinking-dots">
                <i />
                <i />
                <i />
              </span>
            </div>

            <div className="message ai-message result-message">
              Encontré 8 cobros programados para hoy.
            </div>
          </div>
        </div>
      </section>

      <section className="context-section" id="tecnologia">
        <div className="context-content">
          <span className="section-label">CONTEXTO</span>

          <h2>
            Nexora no solo escucha.
            <span>Comprende lo que está pasando.</span>
          </h2>

          <p>
            Una conversación no empieza desde cero cada vez. Nexora puede
            utilizar el contexto disponible para entender referencias,
            decisiones y conversaciones anteriores.
          </p>
        </div>

        <div className="context-card">
          <div className="context-card-header">
            <div>
              <span className="mini-status" />
              Conversación
            </div>

            <span>Ahora</span>
          </div>

          <div className="context-chat">
            <div className="context-message">
              <span>Tú</span>
              ¿Cuál tiene más plata?
            </div>

            <div className="context-message ai-context">
              <span>Nexora</span>
              Carlos, con $184.000 pendientes.
            </div>

            <div className="context-message">
              <span>Tú</span>
              ¿Y está lejos?
            </div>

            <div className="context-message ai-context">
              <span>Nexora</span>
              Carlos está en la zona norte de tu ruta.
            </div>
          </div>

          <div className="context-memory">
            <span className="memory-icon">✦</span>

            <div>
              <strong>Contexto activo</strong>
              <small>La conversación mantiene sus referencias.</small>
            </div>
          </div>
        </div>
      </section>

      <section className="connectors-section" id="conectores">
        <div className="connectors-heading">
          <span className="section-label">CONECTORES</span>

          <h2>
            Una inteligencia.
            <span>Muchos entornos.</span>
          </h2>

          <p>
            Nexora puede conectarse con diferentes proyectos y utilizar
            únicamente las capacidades y datos que cada uno autorice.
          </p>
        </div>

        <div className="connector-system">
          <div className="connector-node connector-main">
            <div className="connector-logo">
              <NexoraLogo size={48} showText={false} />
            </div>

            <div>
              <strong>Nexora</strong>
              <small>Intelligence Core</small>
            </div>
          </div>

          <div className="connector-lines">
            <span />
            <span />
            <span />
          </div>

          <div className="connector-projects">
            <div className="project-card project-active">
              <div className="project-icon">C</div>

              <div>
                <strong>CrediCobro</strong>
                <small>Conectado</small>
              </div>

              <span className="connection-dot" />
            </div>

            <div className="project-card">
              <div className="project-icon">B</div>

              <div>
                <strong>Project B</strong>
                <small>Disponible</small>
              </div>

              <span className="connection-dot" />
            </div>

            <div className="project-card">
              <div className="project-icon">C</div>

              <div>
                <strong>Project C</strong>
                <small>Disponible</small>
              </div>

              <span className="connection-dot" />
            </div>
          </div>
        </div>

        <div className="connector-note">
          <span>✦</span>
          Cada conexión define qué puede conocer y hacer Nexora.
        </div>
      </section>

      <section className="authorization-section" id="autorizacion">
        <div className="authorization-heading">
          <span className="section-label">CONTROL</span>

          <h2>
            Nexora puede actuar.
            <span>Tú decides cuándo.</span>
          </h2>

          <p>
            Las acciones importantes requieren autorización. Nexora puede
            comprender una intención, preparar una acción y pedir tu permiso
            antes de ejecutarla.
          </p>
        </div>

        <div className="authorization-card">
          <div className="authorization-chat">
            <div className="auth-message user-auth">
              <span>Tú</span>
              Déjalo de último.
            </div>

            <div className="auth-message nexora-auth">
              <span>
                <i />
                Nexora
              </span>
              Carlos pasaría al último lugar de tu ruta.
            </div>
          </div>

          <div className="permission-panel">
            <div className="permission-header">
              <div className="permission-icon">✦</div>

              <div>
                <strong>Confirmar acción</strong>
                <small>Modificar ruta</small>
              </div>
            </div>

            <p>
              ¿Quieres que Nexora cambie el orden de tu ruta?
            </p>

            <div className="route-preview">
              <div>
                <span>1</span>
                Carlos
              </div>

              <div className="route-arrow">↓</div>

              <div className="route-highlight">
                <span>Último</span>
                Carlos
              </div>
            </div>

            <div className="permission-actions">
              <button className="permission-cancel">Cancelar</button>
              <button className="permission-confirm">Autorizar</button>
            </div>
          </div>
        </div>
      </section>

      <section className="builder-section" id="builder">
        <div className="builder-heading">
          <span className="section-label">NEXORA BUILDER</span>

          <h2>
            No solo usa tu software.
            <span>Puede ayudarte a construirlo.</span>
          </h2>

          <p>
            Nexora puede analizar la estructura de un proyecto, comprender cómo
            funciona y ayudarte a diseñar nuevas soluciones antes de realizar
            cualquier cambio.
          </p>
        </div>

        <div className="builder-card">
          <div className="builder-window">
            <div className="builder-window-header">
              <div className="builder-window-title">
                <span className="mini-status" />
                Nexora Builder
              </div>

              <span className="builder-window-state">
                Analizando proyecto
              </span>
            </div>

            <div className="builder-body">
              <div className="builder-project">
                <div className="builder-project-header">
                  <span>Proyecto</span>
                  <strong>CrediCobro</strong>
                </div>

                <div className="builder-tree">
                  <div>▾ src</div>
                  <div className="tree-child">▾ components</div>
                  <div className="tree-child tree-deep">▸ credits</div>
                  <div className="tree-child tree-deep">▸ routes</div>
                  <div className="tree-child tree-deep">▸ collections</div>
                  <div className="tree-child">▾ services</div>
                  <div className="tree-child tree-deep">▸ creditService</div>
                  <div className="tree-child tree-deep">▸ routeService</div>
                </div>
              </div>

              <div className="builder-analysis">
                <div className="analysis-step analysis-complete">
                  <span className="analysis-icon">✓</span>

                  <div>
                    <strong>Estructura comprendida</strong>
                    <small>Componentes y servicios identificados</small>
                  </div>
                </div>

                <div className="analysis-step analysis-complete">
                  <span className="analysis-icon">✓</span>

                  <div>
                    <strong>Flujo analizado</strong>
                    <small>Dependencias y relaciones detectadas</small>
                  </div>
                </div>

                <div className="analysis-step analysis-active">
                  <span className="analysis-icon">✦</span>

                  <div>
                    <strong>Propuesta preparada</strong>
                    <small>Optimización del flujo de cobranza</small>
                  </div>
                </div>

                <div className="builder-progress">
                  <div className="builder-progress-track">
                    <span />
                  </div>

                  <small>Preparando recomendación...</small>
                </div>
              </div>
            </div>
          </div>

          <div className="builder-proposal">
            <div className="proposal-header">
              <div className="proposal-icon">✦</div>

              <div>
                <strong>Propuesta de Nexora</strong>
                <small>Antes de realizar cambios</small>
              </div>
            </div>

            <h3>
              Mejorar la gestión de cobros pendientes
            </h3>

            <p>
              Detecté una oportunidad para mostrar los próximos cobros
              utilizando el estado actualizado de cada crédito.
            </p>

            <div className="proposal-actions">
              <button className="proposal-secondary">
                Revisar propuesta
              </button>

              <button className="proposal-primary">
                Autorizar cambio
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="placeholder-section">
        <span className="section-label">NEXORA IA</span>

        <h2>
          Tu contexto.
          <span>Tus reglas.</span>
        </h2>
      </section>
    </main>
  )
}

export default App
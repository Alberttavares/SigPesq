'use client';

import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import axios from 'axios';
import Image from 'next/image';
import {
  LayoutDashboard, Users, FolderOpen, DollarSign,
  BookOpen, Link as LinkIcon, Briefcase, FileText,
  LogOut, Plus, Edit, Trash2, Search, AlertCircle, Check, Menu, X, Eye, EyeOff
} from 'lucide-react';
import {
  TIPO_PARTICIPANTE_LABEL, SITUACAO_PROJETO_LABEL,
  TIPOS_CADASTRO_PUBLICO, podeGerenciar, formatCpf, cpfDigits, validarLogin,
} from './Utils';
import { useResearchData } from './hooks/useResearchData';
import type { ResearchActions } from './hooks/useResearchData';
import { researchService } from './services/research';
import type { CollectionName, RecordOf } from './services/research';
import { authService } from './services/auth';
import type { ParticipacaoDTO } from './services/contracts';
import { getApiErrorMessage } from './services/http';
import type {
  Database, Participante, Projeto, Financiamento, Producao,
  VinculoParticipacao, FinanciamentoProjeto, AutorProducao,
  TipoParticipante, SituacaoProjeto, TipoApoio, UsuarioAutenticado,
} from './Utils';

// --- TYPES ---
type MessageType = 'success' | 'error';
type MessageData = { type: MessageType; text: string } | null;
type ShowMessage = (type: MessageType, text: string) => void;

interface ViewProps {
  db: Database;
  actions: ResearchActions;
  showMessage: ShowMessage;
  // true para Docente e Administrador (cadastrar, editar e excluir).
  podeGerenciar: boolean;
}

// --- UI COMPONENTS ---
// Estilos compartilhados: mantêm o mesmo foco, borda e estado desabilitado em todos os controles.
// O anel de foco aparece só na navegação por teclado (focus-visible), sem afetar o clique com mouse.
const FOCUS_RING = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-700';
// FIELD_BASE não define o arredondamento: campos de formulário usam cantos retos e a busca, arredondados.
const FIELD_BASE = 'w-full min-w-0 border border-gray-400 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm transition-colors placeholder:text-gray-400 enabled:hover:border-gray-500 focus:outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/25 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500';
const FIELD_CLASS = `${FIELD_BASE} rounded-none`;
const LABEL_CLASS = 'text-sm font-semibold text-gray-800 mb-1';
const CARD_CLASS = 'bg-white border border-gray-300 shadow-sm rounded-lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ElementType;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', type = 'button', className = '', icon: Icon, ...props }) => {
  const baseStyle = `min-h-10 px-4 py-2 border rounded-md font-semibold flex items-center justify-center gap-2 transition-colors duration-150 text-sm shadow-sm cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none ${FOCUS_RING}`;
  // enabled: evita efeito de hover/clique em botões desabilitados.
  const variants = {
    primary: 'bg-blue-900 border-blue-950 text-white enabled:hover:bg-blue-800 enabled:active:bg-blue-950',
    secondary: 'bg-gray-200 border-gray-400 text-gray-900 enabled:hover:bg-gray-300 enabled:active:bg-gray-400',
    danger: 'bg-red-700 border-red-800 text-white enabled:hover:bg-red-600 enabled:active:bg-red-800',
  };
  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={16} aria-hidden="true" />}
      {children}
    </button>
  );
};

// Botão só com ícone (ações da tabela, fechar, menu). O label vira title e aria-label.
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  tone?: 'neutral' | 'view' | 'edit' | 'danger' | 'ghost' | 'ghostDark';
  ref?: React.Ref<HTMLButtonElement>;
}

const ICON_TONES = {
  neutral: 'text-gray-700 bg-white border-gray-300 enabled:hover:bg-gray-100 enabled:hover:text-gray-900 enabled:active:bg-gray-200',
  // Cores semânticas das ações: azul = visualizar, amarelo = editar, vermelho = excluir.
  // Ícone escuro (700/800) sobre fundo claro (50) para manter o contraste alto.
  view: 'text-blue-800 bg-blue-50 border-blue-300 enabled:hover:bg-blue-100 enabled:hover:text-blue-950 enabled:active:bg-blue-200',
  edit: 'text-yellow-800 bg-yellow-50 border-yellow-400 enabled:hover:bg-yellow-100 enabled:hover:text-yellow-900 enabled:active:bg-yellow-200',
  danger: 'text-red-700 bg-red-50 border-red-300 enabled:hover:bg-red-100 enabled:hover:text-red-900 enabled:active:bg-red-200',
  ghost: 'text-gray-500 bg-transparent border-transparent enabled:hover:bg-gray-100 enabled:hover:text-gray-900 enabled:active:bg-gray-200',
  ghostDark: 'text-gray-400 bg-transparent border-transparent enabled:hover:bg-gray-800 enabled:hover:text-white',
};

const IconButton: React.FC<IconButtonProps> = ({ label, tone = 'neutral', className = '', children, type = 'button', ref, ...props }) => (
  <button
    ref={ref} type={type} title={label} aria-label={label}
    className={`inline-flex items-center justify-center min-w-8 min-h-8 p-1.5 border rounded-md transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${FOCUS_RING} ${ICON_TONES[tone]} ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  // true: cantos arredondados (telas de login e cadastro); padrão: cantos retos dos formulários do painel.
  rounded?: boolean;
}

const fieldClass = (rounded?: boolean) => (rounded ? `${FIELD_BASE} rounded-md` : FIELD_CLASS);

// O label é ligado ao campo por htmlFor/id: clicar no texto foca o campo e leitores de tela anunciam o nome.
const FieldLabel: React.FC<{ htmlFor: string; label: string; required?: boolean }> = ({ htmlFor, label, required }) => (
  <label htmlFor={htmlFor} className={LABEL_CLASS}>
    {label} {required && <span className="text-red-600" aria-hidden="true">*</span>}
  </label>
);

const Input: React.FC<InputProps> = ({ label, name, type = 'text', value, onChange, required, disabled, placeholder, min, max, step, inputMode, maxLength, autoComplete, rounded }) => {
  const id = React.useId();
  return (
    <div className="flex flex-col mb-4">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <input
        id={id} type={type} name={name} value={value ?? ''} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder} min={min} max={max} step={step}
        inputMode={inputMode} maxLength={maxLength} autoComplete={autoComplete}
        className={fieldClass(rounded)}
      />
    </div>
  );
};

// Campo de senha com botão de olho: começa oculta e só alterna o tipo do input (o valor não muda).
const PasswordInput: React.FC<Omit<InputProps, 'type'>> = ({ label, name, value, onChange, required, disabled, placeholder, autoComplete, rounded }) => {
  const [visivel, setVisivel] = useState(false);
  const id = React.useId();
  return (
    <div className="flex flex-col mb-4">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <div className="relative">
        <input
          id={id} type={visivel ? 'text' : 'password'} name={name} value={value ?? ''} onChange={onChange} required={required} disabled={disabled}
          placeholder={placeholder} autoComplete={autoComplete}
          className={`${fieldClass(rounded)} pr-11`}
        />
        <IconButton
          label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          tone="ghost"
          onClick={() => setVisivel(v => !v)}
          disabled={disabled}
          aria-pressed={visivel}
          className="absolute right-1 top-1/2 -translate-y-1/2"
        >
          {visivel ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}
        </IconButton>
      </div>
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
  rounded?: boolean;
}

const Select: React.FC<SelectProps> = ({ label, name, value, onChange, required, options, disabled, rounded }) => {
  const id = React.useId();
  return (
    <div className="flex flex-col mb-4">
      <FieldLabel htmlFor={id} label={label} required={required} />
      <select
        id={id} name={name} value={value ?? ''} onChange={onChange} required={required} disabled={disabled}
        className={`${fieldClass(rounded)} cursor-pointer`}
      >
        <option value="">Selecione...</option>
        {options.map((opt, i) => (
          <option key={i} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
};

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onView?: (row: T) => void;
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

const renderCell = <T,>(row: T, col: Column<T>): React.ReactNode =>
  col.render ? col.render(row) : (col.accessor ? String(row[col.accessor] ?? '') : '');

const EmptyState: React.FC<{ text?: string }> = ({ text = 'Nenhum registro encontrado.' }) => (
  <p className="p-6 text-center text-sm text-gray-500">{text}</p>
);

function Table<T extends { id: number }>({ columns, data, onView, onEdit, onDelete }: TableProps<T>) {
  const hasActions = Boolean(onView || onEdit || onDelete);

  const renderActions = (row: T) => (
    <>
      {onView && <IconButton label="Visualizar" tone="view" onClick={() => onView(row)}><Eye size={16} aria-hidden="true" /></IconButton>}
      {onEdit && <IconButton label="Editar" tone="edit" onClick={() => onEdit(row)}><Edit size={16} aria-hidden="true" /></IconButton>}
      {onDelete && <IconButton label="Excluir" tone="danger" onClick={() => onDelete(row)}><Trash2 size={16} aria-hidden="true" /></IconButton>}
    </>
  );

  return (
    <>
    {/* Telas pequenas: cada registro é exibido como um cartão */}
    <div className="md:hidden space-y-3">
      {data.length === 0 ? (
        <div className={CARD_CLASS}><EmptyState /></div>
      ) : (
        data.map((row) => (
          <div key={row.id} className={`${CARD_CLASS} overflow-hidden text-sm`}>
            <dl className="divide-y divide-gray-200">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 px-4 py-2.5">
                  <dt className="font-semibold text-gray-600">{col.header}</dt>
                  <dd className="text-gray-900 break-words">{renderCell(row, col)}</dd>
                </div>
              ))}
            </dl>
            {hasActions && (
              <div className="flex justify-end gap-2 px-4 py-2 bg-gray-50 border-t border-gray-200">
                {renderActions(row)}
              </div>
            )}
          </div>
        ))
      )}
    </div>

    <div className={`hidden md:block overflow-x-auto ${CARD_CLASS}`}>
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-100 text-gray-700 border-b border-gray-300">
          <tr>
            {columns.map((col, i) => (
              <th key={i} scope="col" className="px-3 py-3 border-r border-gray-200 text-xs font-bold uppercase tracking-wide whitespace-nowrap">{col.header}</th>
            ))}
            {hasActions && <th scope="col" className="px-3 py-3 text-xs font-bold uppercase tracking-wide text-center whitespace-nowrap">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (hasActions ? 1 : 0)}><EmptyState /></td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-b border-gray-200 last:border-b-0 bg-white transition-colors hover:bg-blue-50/50">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="px-3 py-2.5 border-r border-gray-200 text-gray-900 align-middle">
                    {renderCell(row, col)}
                  </td>
                ))}
                {hasActions && (
                  <td className="px-2 py-2">
                    <div className="flex justify-center gap-1.5">{renderActions(row)}</div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
    </>
  );
}

interface MessageComponentProps {
  type: 'success' | 'error';
  message: string;
  onClose?: () => void;
}

// Erro usa role="alert" (anunciado na hora); sucesso usa role="status" (anúncio discreto).
const Message: React.FC<MessageComponentProps> = ({ type, message, onClose }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`p-3 mb-4 border border-l-4 rounded-md shadow-sm flex items-start justify-between gap-3 ${isError ? 'bg-red-50 border-red-300 border-l-red-600 text-red-900' : 'bg-green-50 border-green-300 border-l-green-600 text-green-900'}`}
    >
      <div className="flex items-start gap-2 min-w-0">
        {isError ? <AlertCircle size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" /> : <Check size={18} className="flex-shrink-0 mt-0.5" aria-hidden="true" />}
        <span className="text-sm font-medium break-words">{message}</span>
      </div>
      {onClose && (
        <button
          type="button" onClick={onClose} title="Fechar mensagem" aria-label="Fechar mensagem"
          className={`-my-1 -mr-1 p-1 opacity-70 cursor-pointer transition-opacity hover:opacity-100 ${FOCUS_RING}`}
        >
          <X size={16} aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

// Modal somente leitura: fundo escurecido com desfoque; fecha no X, no botão, no fundo ou com Esc.
// Ao abrir, o foco vai para o botão de fechar; ao fechar, volta ao elemento que abriu o modal.
interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  const titleId = React.useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeRef.current?.focus();
    return () => previous?.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div
        role="dialog" aria-modal="true" aria-labelledby={titleId}
        className="bg-white border border-gray-300 w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 sm:px-6 border-b border-gray-300 bg-gray-50">
          <h3 id={titleId} className="text-base sm:text-lg font-bold text-gray-900 uppercase tracking-wide break-words">{title}</h3>
          <IconButton ref={closeRef} label="Fechar" tone="ghost" onClick={onClose}><X size={20} aria-hidden="true" /></IconButton>
        </div>
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">{children}</div>
        <div className="flex justify-end px-4 py-3 sm:px-6 border-t border-gray-300 bg-gray-50">
          <Button variant="secondary" onClick={onClose} className="w-full sm:w-auto">Fechar</Button>
        </div>
      </div>
    </div>
  );
};

const isEmptyValue = (value: React.ReactNode) => value === undefined || value === null || value === '';

const DetailList: React.FC<{ items: { label: string; value: React.ReactNode }[] }> = ({ items }) => (
  <dl className="border border-gray-300 rounded-lg overflow-hidden divide-y divide-gray-200 text-sm">
    {items.map((item, i) => (
      <div key={i} className="grid grid-cols-1 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-1 sm:gap-3 px-4 py-2.5 even:bg-gray-50">
        <dt className="font-semibold text-gray-600">{item.label}</dt>
        <dd className="text-gray-900 break-words">{isEmptyValue(item.value) ? '-' : item.value}</dd>
      </div>
    ))}
  </dl>
);

// --- HELPER FUNCTIONS ---
const formatCurrency = (val: number | string | undefined) => {
  if (val === undefined || val === '') return '-';
  const num = typeof val === 'string' ? parseFloat(val) : val;
  if (isNaN(num)) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(num);
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '-';
  const parts = dateString.split('-');
  if (parts.length !== 3) return dateString;
  const [y, m, d] = parts;
  return `${d}/${m}/${y}`;
};

// Converte o valor de um campo de formulário em número (vazio = não informado).
const toNumber = (value: string): number | undefined => (value === '' ? undefined : Number(value));

// Valida que a data final (opcional) não é anterior à data inicial (formato AAAA-MM-DD).
const isDateRangeValid = (inicio?: string, fim?: string) => !inicio || !fim || fim >= inicio;

const labelTipoParticipante = (tipo: TipoParticipante) => TIPO_PARTICIPANTE_LABEL[tipo] ?? tipo;
const labelSituacaoProjeto = (situacao: SituacaoProjeto) => SITUACAO_PROJETO_LABEL[situacao] ?? situacao;

// Conecta cada tela ao serviço sem alterar sua apresentação.
function collectionActions<K extends CollectionName>(actions: ResearchActions, key: K) {
  return {
    onSave: (data: Partial<RecordOf<K>>) => actions.save(key, data),
    onDelete: (data: RecordOf<K>) => actions.remove(key, data),
  };
}

// Itens do menu lateral. O título do topo usa o mesmo rótulo do item ativo.
interface NavItem { route: string; label: string; icon: React.ElementType }
const NAV_PRINCIPAL: NavItem[] = [
  { route: 'dashboard', label: 'Painel Inicial', icon: LayoutDashboard },
  { route: 'projetos', label: 'Projetos de pesquisa', icon: FolderOpen },
  { route: 'participantes', label: 'Participantes', icon: Users },
  { route: 'financiamentos', label: 'Financiamentos', icon: DollarSign },
  { route: 'producoes', label: 'Produções científicas', icon: BookOpen },
];
const NAV_ASSOCIACOES: NavItem[] = [
  { route: 'vinculos', label: 'Vínculos de participação', icon: Briefcase },
  { route: 'financiamentosProjeto', label: 'Financiamentos por projeto', icon: LinkIcon },
  { route: 'autores', label: 'Autores das produções', icon: FileText },
];
const routeLabel = (route: string) =>
  [...NAV_PRINCIPAL, ...NAV_ASSOCIACOES].find(item => item.route === route)?.label ?? 'Painel Inicial';

// --- MAIN APPLICATION COMPONENT ---
type AuthState = { modo: 'login' | 'cadastro'; aviso?: string; cpf?: string };

export default function App() {
  // Usuário retornado por POST /auth/login. null = não autenticado.
  const [usuario, setUsuario] = useState<UsuarioAutenticado | null>(null);
  const [authState, setAuthState] = useState<AuthState>({ modo: 'login' });
  const [currentRoute, setCurrentRoute] = useState<string>('dashboard');
  const [message, setMessage] = useState<MessageData>(null);
  // Controla o menu lateral em telas pequenas (em telas médias ou maiores ele fica sempre visível).
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Oculta a mensagem após 5 segundos (o timer é reiniciado a cada nova mensagem).
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  const showMessage: ShowMessage = useCallback((type, text) => {
    setMessage({ type, text });
  }, []);
  const { db, actions } = useResearchData(usuario !== null, currentRoute, showMessage, usuario?.cpf);

  if (!usuario) {
    if (authState.modo === 'cadastro') {
      return (
        <CadastroScreen
          onConcluido={cpf => setAuthState({ modo: 'login', cpf, aviso: 'Cadastro realizado com sucesso. Entre com seu CPF e a senha cadastrada.' })}
          onVoltar={() => setAuthState({ modo: 'login' })}
        />
      );
    }
    return (
      <LoginScreen
        cpfInicial={authState.cpf}
        aviso={authState.aviso}
        onLogin={u => { setUsuario(u); setAuthState({ modo: 'login' }); }}
        onCadastrar={() => setAuthState({ modo: 'cadastro' })}
      />
    );
  }

  const gerenciar = podeGerenciar(usuario.tipo);
  const viewProps: ViewProps = { db, actions, showMessage, podeGerenciar: gerenciar };

  const navigate = (route: string) => {
    setCurrentRoute(route);
    setMessage(null);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    setUsuario(null);
    setAuthState({ modo: 'login' });
    setSidebarOpen(false);
    setCurrentRoute('dashboard');
    setMessage(null);
  };

  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard': return <Dashboard db={db} usuario={usuario} />;
      case 'projetos': return <ProjetosView {...viewProps} />;
      case 'participantes': return <ParticipantesView {...viewProps} />;
      case 'financiamentos': return <FinanciamentosView {...viewProps} />;
      case 'producoes': return <ProducoesView {...viewProps} />;
      case 'vinculos': return <VinculosParticipacaoView {...viewProps} />;
      case 'financiamentosProjeto': return <FinanciamentosProjetoView {...viewProps} />;
      case 'autores': return <AutoresProducaoView {...viewProps} />;
      default: return <Dashboard db={db} usuario={usuario} />;
    }
  };

  return (
    <div className="flex h-screen h-dvh bg-gray-100 font-sans text-gray-900 rounded-none">
      {/* Fundo escurecido do menu lateral em telas pequenas */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} aria-hidden="true" />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 w-64 max-w-[80vw] bg-gray-900 text-gray-300 flex flex-col border-r border-gray-950 flex-shrink-0 transform transition-transform duration-200 md:static md:max-w-none md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4 bg-gray-950 border-b border-gray-800 flex items-start justify-between">
          <div>
            <h1 className="leading-none">
              {/* Logo branca sem fundo: o fundo do menu aparece atrás dela. next/image entrega a imagem
                  redimensionada para o tamanho exibido (o PNG original tem 2172×724). */}
              <Image src="/images/newLogo.png" alt="SigPesq" width={2172} height={724} priority sizes="96px" className="h-8 w-auto -ml-1" />
            </h1>
            <p className="text-xs text-gray-400 mt-1">Gestão de Projetos</p>
          </div>
          <IconButton label="Fechar menu" tone="ghostDark" onClick={() => setSidebarOpen(false)} className="md:hidden">
            <X size={20} aria-hidden="true" />
          </IconButton>
        </div>
        <nav aria-label="Menu principal" className="flex-1 overflow-y-auto py-2">
          {NAV_PRINCIPAL.map(item => (
            <MenuLink key={item.route} icon={item.icon} label={item.label} active={currentRoute === item.route} onClick={() => navigate(item.route)} />
          ))}
          <div className="my-2 border-t border-gray-800"></div>
          <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Associações</p>
          {NAV_ASSOCIACOES.map(item => (
            <MenuLink key={item.route} icon={item.icon} label={item.label} active={currentRoute === item.route} onClick={() => navigate(item.route)} />
          ))}
        </nav>
        <div className="p-3 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white hover:bg-gray-800 transition-colors w-full px-3 py-2 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400"
          >
            <LogOut size={16} aria-hidden="true" /> Sair do sistema
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-300 shadow-sm px-4 py-3 md:px-6 md:py-4 flex justify-between items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <IconButton label="Abrir menu" tone="ghost" onClick={() => setSidebarOpen(true)} className="md:hidden -ml-1">
              <Menu size={22} aria-hidden="true" />
            </IconButton>
            <h2 className="text-lg md:text-xl font-bold text-gray-900 truncate">{routeLabel(currentRoute)}</h2>
          </div>
          {/* Nome em destaque em cima; tipo do usuário em tom mais fraco embaixo. */}
          <div className="flex flex-col items-end text-right min-w-0 leading-tight">
            <span className="text-sm font-semibold text-gray-900 truncate max-w-[45vw] sm:max-w-xs">{usuario.nome}</span>
            <span className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">{labelTipoParticipante(usuario.tipo)}</span>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto">
          {message && <Message type={message.type} message={message.text} onClose={() => setMessage(null)} />}
          {renderContent()}
        </main>
      </div>
    </div>
  );
}

interface MenuLinkProps {
  icon: React.ElementType;
  label: string;
  active: boolean;
  onClick: () => void;
}

const MenuLink: React.FC<MenuLinkProps> = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    aria-current={active ? 'page' : undefined}
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-l-4 cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-blue-400 ${
      active ? 'bg-blue-900 text-white font-semibold border-blue-500' : 'border-transparent hover:bg-gray-800 hover:text-gray-100 active:bg-gray-700'
    }`}
  >
    <Icon size={18} aria-hidden="true" />
    {label}
  </button>
);

// --- VIEWS ---

// Moldura das telas de login e cadastro. A logo é a mesma branca do menu, pintada de preto com o
// filtro brightness-0 (zera o brilho e mantém a transparência), para aparecer sobre o cartão branco.
const AuthCard: React.FC<{ subtitle: string; wide?: boolean; children: React.ReactNode }> = ({ subtitle, wide, children }) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4 py-10">
    <main className={`bg-white border border-gray-200 border-t-4 border-t-blue-900 rounded-xl shadow-lg w-full ${wide ? 'max-w-lg' : 'max-w-md'} p-6 sm:p-8`}>
      <div className="flex flex-col items-center text-center mb-6 pb-5 border-b border-gray-200">
        <h1>
          <Image src="/images/newLogo.png" alt="SigPesq" width={2172} height={724} priority sizes="168px" className="h-14 w-auto brightness-0" />
        </h1>
        <p className="text-sm text-gray-600 mt-2">{subtitle}</p>
      </div>
      {children}
    </main>
  </div>
);

interface LoginScreenProps {
  onLogin: (usuario: UsuarioAutenticado) => void;
  onCadastrar: () => void;
  cpfInicial?: string;
  aviso?: string;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, onCadastrar, cpfInicial, aviso }) => {
  const [cpf, setCpf] = useState(formatCpf(cpfInicial ?? ''));
  const [senha, setSenha] = useState('');
  const [feedback, setFeedback] = useState<MessageData>(aviso ? { type: 'success', text: aviso } : null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    const erro = validarLogin(cpf, senha);
    if (erro) {
      setFeedback({ type: 'error', text: erro });
      return;
    }
    setEnviando(true);
    setFeedback(null);
    try {
      onLogin(await authService.login(cpf, senha));
    } catch (error) {
      setFeedback({ type: 'error', text: getApiErrorMessage(error) });
      setEnviando(false);
    }
  };

  return (
    <AuthCard subtitle="Projetos de Pesquisa Universitários">
      {feedback && <Message type={feedback.type} message={feedback.text} onClose={() => setFeedback(null)} />}
      {/* noValidate: as mensagens de preenchimento são exibidas por validarLogin */}
      <form onSubmit={handleSubmit} noValidate>
        <Input
          label="CPF"
          value={cpf}
          onChange={(e) => setCpf(formatCpf(e.target.value))}
          placeholder="000.000.000-00"
          inputMode="numeric"
          maxLength={14}
          autoComplete="username"
          required
          rounded
        />
        <PasswordInput
          label="Senha"
          autoComplete="current-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
          rounded
        />
        <div className="pt-2">
          <Button type="submit" className="w-full" disabled={enviando}>{enviando ? 'Entrando...' : 'Entrar'}</Button>
        </div>
      </form>
      <p className="mt-6 pt-5 border-t border-gray-200 text-center text-sm text-gray-600">
        Ainda não tem acesso?{' '}
        <button type="button" onClick={onCadastrar} className={`font-bold text-blue-900 underline-offset-2 hover:underline cursor-pointer ${FOCUS_RING}`}>Cadastre-se</button>
      </p>
    </AuthCard>
  );
};

interface CadastroScreenProps {
  onConcluido: (cpf: string) => void;
  onVoltar: () => void;
}

// Cadastro público de participantes: mesmos campos do formulário do painel + senha.
const CadastroScreen: React.FC<CadastroScreenProps> = ({ onConcluido, onVoltar }) => {
  const [data, setData] = useState({ nome: '', email: '', cpf: '', tipo: '' as TipoParticipante | '', senha: '' });
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (enviando) return;
    if (cpfDigits(data.cpf).length !== 11) {
      setErro('O CPF deve conter 11 números.');
      return;
    }
    if (!data.tipo) {
      setErro('Selecione o tipo de participante.');
      return;
    }
    if (data.senha.length < 6 || data.senha.length > 100) {
      setErro('A senha deve ter entre 6 e 100 caracteres.');
      return;
    }
    setEnviando(true);
    setErro(null);
    try {
      const cpf = await authService.cadastrar({ ...data, tipo: data.tipo });
      onConcluido(cpf);
    } catch (error) {
      setErro(getApiErrorMessage(error));
      setEnviando(false);
    }
  };

  return (
    <AuthCard subtitle="Cadastro de participante" wide>
      {erro && <Message type="error" message={erro} onClose={() => setErro(null)} />}
      <form onSubmit={handleSubmit}>
        <Input label="Nome Completo" autoComplete="name" value={data.nome} onChange={e => setData({ ...data, nome: e.target.value })} required rounded />
        <Input label="E-mail Institucional" type="email" autoComplete="email" value={data.email} onChange={e => setData({ ...data, email: e.target.value })} required rounded />
        {/* Mesma máscara do login: só números, no máximo 11, formatados como 000.000.000-00. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input
            label="CPF"
            value={data.cpf}
            onChange={e => setData({ ...data, cpf: formatCpf(e.target.value) })}
            placeholder="000.000.000-00"
            inputMode="numeric"
            maxLength={14}
            required
            rounded
          />
          <Select
            label="Tipo de Participante"
            value={data.tipo}
            onChange={e => setData({ ...data, tipo: e.target.value as TipoParticipante })}
            required
            rounded
            options={TIPOS_CADASTRO_PUBLICO.map(tipo => ({ value: tipo, label: labelTipoParticipante(tipo) }))}
          />
        </div>
        <PasswordInput label="Senha (mínimo de 6 caracteres)" autoComplete="new-password" value={data.senha} onChange={e => setData({ ...data, senha: e.target.value })} required rounded />
        <div className="flex flex-col gap-2 pt-2">
          <Button type="submit" icon={Check} className="w-full" disabled={enviando}>{enviando ? 'Cadastrando...' : 'Cadastrar'}</Button>
          <Button variant="secondary" onClick={onVoltar} className="w-full" disabled={enviando}>Voltar ao login</Button>
        </div>
      </form>
    </AuthCard>
  );
};

const Dashboard: React.FC<{ db: Database; usuario: UsuarioAutenticado }> = ({ db, usuario }) => {
  // min-h-full + flex-1: em telas maiores a grade 2×2 ocupa a altura disponível, sem um grande vazio abaixo.
  return (
    <div className="flex flex-col gap-4 sm:gap-6 min-h-full">
      <section className={`${CARD_CLASS} border-l-4 border-l-blue-900 p-6 sm:p-8`}>
        <h3 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight break-words">Olá, {usuario.nome}</h3>
        <p className="mt-3 max-w-3xl text-base sm:text-lg leading-relaxed text-gray-600">
          Sistema administrativo para gerenciamento de projetos de pesquisa universitários, participantes, financiamentos e produções científicas associadas.
        </p>
      </section>
      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 sm:auto-rows-fr gap-4 sm:gap-6">
        <StatCard title="Projetos" value={db.projetos.length} icon={FolderOpen} />
        <StatCard title="Participantes" value={db.participantes.length} icon={Users} />
        <StatCard title="Financiamentos" value={db.financiamentos.length} icon={DollarSign} />
        <StatCard title="Produções" value={db.producoes.length} icon={BookOpen} />
      </div>
    </div>
  );
};

// Os ícones repetem os do menu lateral, para associar o número à tela correspondente.
const StatCard: React.FC<{ title: string; value: number; icon: React.ElementType }> = ({ title, value, icon: Icon }) => (
  <div className={`${CARD_CLASS} border-t-4 border-t-blue-900 min-h-36 p-6 sm:p-8 flex flex-col items-center justify-center text-center min-w-0`}>
    <Icon size={28} className="text-blue-900/70 mb-3" aria-hidden="true" />
    <div className="text-5xl sm:text-6xl font-bold text-blue-900 leading-none">{value}</div>
    <div className="mt-3 text-sm font-bold text-gray-600 uppercase tracking-wider break-words">{title}</div>
  </div>
);

// --- GENERIC CRUD BASE ---
interface CrudViewProps<T> {
  title: string;
  items: T[];
  onSave: (data: Partial<T>) => Promise<boolean>;
  onDelete: (item: T) => Promise<boolean>;
  db: Database;
  columns: Column<T>[];
  renderForm: (data: Partial<T>, setData: React.Dispatch<React.SetStateAction<Partial<T>>>, db: Database) => React.ReactNode;
  showMessage: ShowMessage;
  // Sem getInitialForm a tela não oferece cadastro (ex.: participantes, cadastrados na tela de login).
  getInitialForm?: () => Partial<T>;
  // Retorna uma mensagem de erro quando os dados do formulário são inválidos.
  validate?: (data: Partial<T>, items: T[]) => string | null;
  // false (Discente/Técnico): oculta cadastro, edição e exclusão; mantém a visualização.
  podeGerenciar: boolean;
  // Campos do modal de visualização (padrão: as colunas da tabela).
  detailColumns?: Column<T>[];
  // Conteúdo adicional exibido no modal de visualização.
  renderDetailsExtra?: (row: T) => React.ReactNode;
}

function CrudView<T extends { id: number }>({ title, items, onSave, onDelete, db, columns, renderForm, showMessage, getInitialForm, validate, podeGerenciar, detailColumns, renderDetailsExtra }: CrudViewProps<T>) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<T>>({});
  const [viewing, setViewing] = useState<T | null>(null);
  const closeViewing = useCallback(() => setViewing(null), []);
  // pending evita cliques duplos imediatos; saving mostra o estado na interface.
  const pending = useRef(false);
  const [saving, setSaving] = useState(false);

  // A pesquisa considera os campos do registro e os textos exibidos nas colunas
  // (ex.: nome do coordenador, código do projeto relacionado).
  const term = searchTerm.trim().toLowerCase();
  const filteredData = term ? items.filter(item => {
    const rawValues = Object.values(item).map(val => String(val ?? ''));
    const renderedValues = columns
      .map(col => (col.render ? col.render(item) : null))
      .filter((val): val is string | number => typeof val === 'string' || typeof val === 'number')
      .map(String);
    return [...rawValues, ...renderedValues].some(val => val.toLowerCase().includes(term));
  }) : items;

  const handleNovo = () => {
    if (!getInitialForm) return;
    setFormData(getInitialForm());
    setView('form');
  };

  const handleEditar = (item: T) => {
    setFormData({ ...item });
    setView('form');
  };

  const handleExcluir = async (item: T) => {
    if (pending.current) return;
    if (window.confirm(`Tem certeza que deseja excluir este registro? Essa ação não pode ser desfeita.`)) {
      pending.current = true;
      try {
        if (await onDelete(item)) showMessage('success', 'Registro excluído com sucesso.');
      } catch (error) {
        showMessage('error', getApiErrorMessage(error));
      } finally {
        pending.current = false;
      }
    }
  };

  const handleSalvar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pending.current) return;
    const error = validate?.(formData, items);
    if (error) {
      showMessage('error', error);
      return;
    }
    pending.current = true;
    setSaving(true);
    try {
      if (await onSave(formData)) {
        if (formData.id !== undefined) showMessage('success', 'Registro atualizado com sucesso.');
        else showMessage('success', 'Registro cadastrado com sucesso.');
      }
      setView('list');
    } catch (error) {
      showMessage('error', getApiErrorMessage(error));
    } finally {
      pending.current = false;
      setSaving(false);
    }
  };

  if (view === 'form') {
    return (
      <div className={`${CARD_CLASS} overflow-hidden p-4 sm:p-6`}>
        <h3 className="text-base sm:text-lg font-bold text-gray-900 border-b border-gray-200 pb-3 mb-5 uppercase tracking-wide break-words">
          {formData.id ? `Editar ${title}` : `Novo ${title}`}
        </h3>
        <form onSubmit={handleSalvar}>
          {renderForm(formData, setFormData, db)}
          <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-4 border-t border-gray-300 bg-gray-50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4">
            <Button type="submit" icon={Check} className="w-full sm:w-auto" disabled={saving}>{saving ? 'Salvando...' : 'Salvar Dados'}</Button>
            <Button variant="secondary" onClick={() => setView('list')} className="w-full sm:w-auto" disabled={saving}>Cancelar</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className={`${CARD_CLASS} flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 p-4`}>
        <div className="relative w-full sm:w-1/2">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" aria-hidden="true" />
          <input
            type="search"
            aria-label="Pesquisar registros"
            placeholder="Pesquisar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${FIELD_BASE} rounded-md pl-9`}
          />
        </div>
        {podeGerenciar && getInitialForm && (
          <Button onClick={handleNovo} icon={Plus} className="w-full sm:w-auto flex-shrink-0">Novo Registro</Button>
        )}
      </div>
      <Table
        columns={columns}
        data={filteredData}
        onView={setViewing}
        onEdit={podeGerenciar ? handleEditar : undefined}
        onDelete={podeGerenciar ? handleExcluir : undefined}
      />
      {viewing && (
        <Modal title={`Visualizar ${title}`} onClose={closeViewing}>
          <DetailList items={(detailColumns ?? columns).map(col => ({ label: col.header, value: renderCell(viewing, col) }))} />
          {renderDetailsExtra?.(viewing)}
        </Modal>
      )}
    </div>
  );
}


// Participantes vinculados a um projeto, lidos de GET /vinculos-projeto/projeto/{codigo}.
type ParticipantesState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ok'; items: ParticipacaoDTO[] };

// Quantos participantes aparecem sem rolagem; acima disso, a lista rola e o modal não cresce.
const PARTICIPANTES_VISIVEIS = 4;

const ProjetoParticipantes: React.FC<{ codigoProjeto: string }> = ({ codigoProjeto }) => {
  const [state, setState] = useState<ParticipantesState>({ status: 'loading' });
  const listRef = useRef<HTMLUListElement>(null);
  const itemCount = state.status === 'ok' ? state.items.length : 0;
  const rolavel = itemCount > PARTICIPANTES_VISIVEIS;

  // A altura dos itens varia (nomes longos quebram linha; no celular cada item ocupa 3 linhas),
  // então a altura máxima é medida: vai até o fim do 4º item. Recalcula quando a lista muda de largura.
  useLayoutEffect(() => {
    const ul = listRef.current;
    if (!ul) return;
    if (!rolavel) {
      ul.style.maxHeight = '';
      return;
    }
    const medir = () => {
      const quarto = ul.children[PARTICIPANTES_VISIVEIS - 1] as HTMLElement | undefined;
      if (!quarto) return;
      const bordas = ul.offsetHeight - ul.clientHeight;
      ul.style.maxHeight = `${quarto.offsetTop + quarto.offsetHeight + bordas}px`;
    };
    medir();
    const observer = new ResizeObserver(medir);
    observer.observe(ul);
    return () => observer.disconnect();
  }, [rolavel, itemCount]);

  useEffect(() => {
    const controller = new AbortController();
    researchService.listParticipacoesDoProjeto(codigoProjeto, controller.signal)
      .then(items => setState({ status: 'ok', items }))
      .catch(error => {
        if (!axios.isCancel(error)) setState({ status: 'error', message: getApiErrorMessage(error) });
      });
    return () => controller.abort();
  }, [codigoProjeto]);

  return (
    <section>
      <h4 className="text-sm font-bold uppercase tracking-wide text-gray-700 border-b border-gray-200 pb-2 mb-3">
        Participantes vinculados{state.status === 'ok' ? ` (${state.items.length})` : ''}
      </h4>
      {state.status === 'loading' && <p className="text-sm text-gray-500" role="status">Carregando participantes...</p>}
      {state.status === 'error' && <Message type="error" message={state.message} />}
      {state.status === 'ok' && (
        state.items.length === 0 ? (
          <p className="p-3 text-sm text-center text-gray-500 border border-gray-300 rounded-lg">Nenhum participante vinculado a este projeto.</p>
        ) : (
          <ul
            ref={listRef}
            // Com rolagem, a lista recebe foco pelo Tab para ser rolada pelo teclado (setas).
            tabIndex={rolavel ? 0 : undefined}
            aria-label={rolavel ? 'Lista de participantes vinculados (role para ver todos)' : undefined}
            className={`relative border border-gray-300 rounded-lg divide-y divide-gray-200 text-sm ${rolavel ? `overflow-y-auto overscroll-contain ${FOCUS_RING}` : 'overflow-hidden'}`}
          >
            {state.items.map(v => (
              <li key={v.cpfParticipante} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 even:bg-gray-50">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 break-words">{v.nomeParticipante || v.cpfParticipante}</p>
                  <p className="text-gray-600">
                    {v.tipoParticipante ? labelTipoParticipante(v.tipoParticipante as TipoParticipante) : '-'} · {v.funcao}
                  </p>
                </div>
                <p className="text-gray-600 sm:text-right whitespace-nowrap">
                  {formatDate(v.dataEntrada ?? undefined)} a {v.dataSaida ? formatDate(v.dataSaida) : 'Atual'}
                </p>
              </li>
            ))}
          </ul>
        )
      )}
    </section>
  );
};

// --- SPECIFIC VIEWS ---

const ProjetosView: React.FC<ViewProps> = ({ db, actions, showMessage, podeGerenciar }) => {
  return (
    <CrudView<Projeto>
      title="Projeto"
      items={db.projetos}
      {...collectionActions(actions, 'projetos')}
      db={db} showMessage={showMessage} podeGerenciar={podeGerenciar}
      getInitialForm={() => ({ codigo: '', titulo: '', descricao: '', coordenadorId: undefined, dataInicio: '', dataTermino: '', situacao: 'Em andamento' })}
      validate={(data, items) => {
        const codigo = data.codigo?.trim().toLowerCase();
        if (items.some(p => p.id !== data.id && p.codigo.trim().toLowerCase() === codigo)) return 'Já existe um projeto cadastrado com este código.';
        if (!isDateRangeValid(data.dataInicio, data.dataTermino)) return 'A data de término não pode ser anterior à data de início.';
        return null;
      }}
      columns={[
        { header: 'Código', accessor: 'codigo' },
        { header: 'Título', accessor: 'titulo' },
        { header: 'Coordenador', render: row => db.participantes.find(p => p.id === row.coordenadorId)?.nome || 'N/A' },
        { header: 'Início', render: row => formatDate(row.dataInicio) },
        { header: 'Término', render: row => formatDate(row.dataTermino) },
        { header: 'Situação', render: row => labelSituacaoProjeto(row.situacao) }
      ]}
      detailColumns={[
        { header: 'Código', accessor: 'codigo' },
        { header: 'Título', accessor: 'titulo' },
        { header: 'Descrição', accessor: 'descricao' },
        { header: 'Coordenador', render: row => db.participantes.find(p => p.id === row.coordenadorId)?.nome || 'N/A' },
        { header: 'Início', render: row => formatDate(row.dataInicio) },
        { header: 'Término', render: row => formatDate(row.dataTermino) },
        { header: 'Situação', render: row => labelSituacaoProjeto(row.situacao) }
      ]}
      renderDetailsExtra={row => <ProjetoParticipantes key={row.codigo} codigoProjeto={row.codigo} />}
      renderForm={(data, setData, db) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input label="Código do Projeto" value={data.codigo || ''} onChange={e => setData({...data, codigo: e.target.value})} required />
          <Input label="Título" value={data.titulo || ''} onChange={e => setData({...data, titulo: e.target.value})} required />
          <div className="sm:col-span-2">
            <Input label="Descrição" value={data.descricao || ''} onChange={e => setData({...data, descricao: e.target.value})} />
          </div>
          <Select
            label="Coordenador Principal (Docente)"
            value={String(data.coordenadorId ?? '')}
            onChange={e => setData({...data, coordenadorId: toNumber(e.target.value)})}
            required
            options={db.participantes.filter(p => p.tipo === 'Docente').map(p => ({ value: p.id, label: `${p.nome} (${p.cpf})` }))}
          />
          <Select
            label="Situação"
            value={data.situacao || ''}
            onChange={e => setData({...data, situacao: e.target.value as SituacaoProjeto})}
            required
            options={[ {value: 'Em andamento', label: 'Em andamento'}, {value: 'Concluido', label: 'Concluído'}, {value: 'Cancelado', label: 'Cancelado'} ]}
          />
          <Input type="date" label="Data de Início" value={data.dataInicio || ''} onChange={e => setData({...data, dataInicio: e.target.value})} required />
          <Input type="date" label="Data de Término" value={data.dataTermino || ''} onChange={e => setData({...data, dataTermino: e.target.value})} required />
        </div>
      )}
    />
  );
};

const ParticipantesView: React.FC<ViewProps> = ({ db, actions, showMessage, podeGerenciar }) => {
  return (
    <CrudView<Participante>
      title="Participante"
      items={db.participantes}
      {...collectionActions(actions, 'participantes')}
      db={db} showMessage={showMessage} podeGerenciar={podeGerenciar}
      validate={(data, items) => {
        const cpf = data.cpf?.trim();
        if (items.some(p => p.id !== data.id && p.cpf.trim() === cpf)) return 'Já existe um participante cadastrado com este CPF.';
        return null;
      }}
      columns={[
        { header: 'Nome Completo', accessor: 'nome' },
        { header: 'E-mail Institucional', accessor: 'email' },
        { header: 'CPF', accessor: 'cpf' },
        { header: 'Tipo', render: row => labelTipoParticipante(row.tipo) }
      ]}
      renderForm={(data, setData, db) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="sm:col-span-2">
            <Input label="Nome Completo" value={data.nome || ''} onChange={e => setData({...data, nome: e.target.value})} required />
          </div>
          <Input label="E-mail Institucional" type="email" value={data.email || ''} onChange={e => setData({...data, email: e.target.value})} required />
          <Input label="CPF (Formato: 000.000.000-00)" value={data.cpf || ''} onChange={e => setData({...data, cpf: e.target.value})} required />
          <Select
            label="Tipo de Participante"
            value={data.tipo || ''}
            onChange={e => setData({...data, tipo: e.target.value as TipoParticipante})}
            required
            options={tiposParaEdicao(db.participantes.find(p => p.id === data.id)?.tipo).map(tipo => ({ value: tipo, label: labelTipoParticipante(tipo) }))}
          />
        </div>
      )}
    />
  );
};

// Administrador não é oferecido como opção; só é mantido ao editar um registro que já é Administrador.
const tiposParaEdicao = (tipoOriginal?: TipoParticipante): TipoParticipante[] =>
  tipoOriginal === 'Administrador' ? [...TIPOS_CADASTRO_PUBLICO, 'Administrador'] : TIPOS_CADASTRO_PUBLICO;

const FinanciamentosView: React.FC<ViewProps> = ({ db, actions, showMessage, podeGerenciar }) => {
  return (
    <CrudView<Financiamento>
      title="Financiamento"
      items={db.financiamentos}
      {...collectionActions(actions, 'financiamentos')}
      db={db} showMessage={showMessage} podeGerenciar={podeGerenciar}
      getInitialForm={() => ({ agencia: '', tipoFomento: '', valorTotal: undefined, inicioVigencia: '', fimVigencia: '' })}
      validate={data => {
        if (!isDateRangeValid(data.inicioVigencia, data.fimVigencia)) return 'O fim da vigência não pode ser anterior ao início.';
        return null;
      }}
      columns={[
        { header: 'ID', accessor: 'id' },
        { header: 'Agência', accessor: 'agencia' },
        { header: 'Tipo de Fomento', accessor: 'tipoFomento' },
        { header: 'Valor Total', render: row => formatCurrency(row.valorTotal) },
        { header: 'Período', render: row => `${formatDate(row.inicioVigencia)} - ${formatDate(row.fimVigencia)}` }
      ]}
      renderForm={(data, setData) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Input label="Agência Financiadora (ex: CNPq, FAPES)" value={data.agencia || ''} onChange={e => setData({...data, agencia: e.target.value})} required />
          <Input label="Tipo de Fomento" value={data.tipoFomento || ''} onChange={e => setData({...data, tipoFomento: e.target.value})} required />
          <Input label="Valor Total (R$)" type="number" min="0" step="0.01" value={String(data.valorTotal ?? '')} onChange={e => setData({...data, valorTotal: toNumber(e.target.value)})} required />
          <div className="hidden"></div>
          <Input type="date" label="Início da Vigência" value={data.inicioVigencia || ''} onChange={e => setData({...data, inicioVigencia: e.target.value})} required />
          <Input type="date" label="Fim da Vigência" value={data.fimVigencia || ''} onChange={e => setData({...data, fimVigencia: e.target.value})} required />
        </div>
      )}
    />
  );
};

const ProducoesView: React.FC<ViewProps> = ({ db, actions, showMessage, podeGerenciar }) => {
  return (
    <CrudView<Producao>
      title="Produção Científica"
      items={db.producoes}
      {...collectionActions(actions, 'producoes')}
      db={db} showMessage={showMessage} podeGerenciar={podeGerenciar}
      getInitialForm={() => ({ titulo: '', tipo: 'Artigo', ano: undefined, meioDivulgacao: '', projetoId: undefined })}
      columns={[
        { header: 'ID', accessor: 'id' },
        { header: 'Título', accessor: 'titulo' },
        { header: 'Tipo', accessor: 'tipo' },
        { header: 'Ano', accessor: 'ano' },
        { header: 'Projeto Relacionado', render: row => db.projetos.find(p => p.id === row.projetoId)?.codigo || 'N/A' }
      ]}
      detailColumns={[
        { header: 'ID', accessor: 'id' },
        { header: 'Título', accessor: 'titulo' },
        { header: 'Tipo', accessor: 'tipo' },
        { header: 'Ano', accessor: 'ano' },
        { header: 'Meio de Divulgação', accessor: 'meioDivulgacao' },
        { header: 'Projeto Relacionado', render: row => {
            const projeto = db.projetos.find(p => p.id === row.projetoId);
            return projeto ? `${projeto.codigo} - ${projeto.titulo}` : 'N/A';
          }
        }
      ]}
      renderForm={(data, setData, db) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="sm:col-span-2">
            <Input label="Título da Produção" value={data.titulo || ''} onChange={e => setData({...data, titulo: e.target.value})} required />
          </div>
          <Select
            label="Tipo de Produção"
            value={data.tipo || ''}
            onChange={e => setData({...data, tipo: e.target.value})}
            required
            options={[
              {value: 'Artigo', label: 'Artigo'},
              {value: 'Capítulo de livro', label: 'Capítulo de livro'},
              {value: 'Software', label: 'Software'},
              {value: 'Relatório técnico', label: 'Relatório técnico'}
            ]}
          />
          <Input label="Ano de Publicação" type="number" min="1900" max="2100" value={String(data.ano ?? '')} onChange={e => setData({...data, ano: toNumber(e.target.value)})} required />
          <Input label="Meio de Divulgação (Revista, Evento)" value={data.meioDivulgacao || ''} onChange={e => setData({...data, meioDivulgacao: e.target.value})} />
          <Select
            label="Projeto Relacionado"
            value={String(data.projetoId ?? '')}
            onChange={e => setData({...data, projetoId: toNumber(e.target.value)})}
            required
            options={db.projetos.map(p => ({ value: p.id, label: `${p.codigo} - ${p.titulo}` }))}
          />
        </div>
      )}
    />
  );
};

const VinculosParticipacaoView: React.FC<ViewProps> = ({ db, actions, showMessage, podeGerenciar }) => {
  return (
    <CrudView<VinculoParticipacao>
      title="Vínculo de Participação"
      items={db.vinculosParticipacao}
      {...collectionActions(actions, 'vinculosParticipacao')}
      db={db} showMessage={showMessage} podeGerenciar={podeGerenciar}
      getInitialForm={() => ({ projetoId: undefined, participanteId: undefined, funcao: 'Colaborador', dataEntrada: '', dataSaida: '' })}
      validate={data => {
        if (!isDateRangeValid(data.dataEntrada, data.dataSaida)) return 'A data de saída não pode ser anterior à data de entrada.';
        return null;
      }}
      columns={[
        { header: 'Projeto', render: row => db.projetos.find(p => p.id === row.projetoId)?.codigo || 'Desconhecido' },
        { header: 'Participante', render: row => db.participantes.find(p => p.id === row.participanteId)?.nome || 'Desconhecido' },
        { header: 'Função', accessor: 'funcao' },
        { header: 'Período', render: row => `${formatDate(row.dataEntrada)} a ${row.dataSaida ? formatDate(row.dataSaida) : 'Atual'}` }
      ]}
      renderForm={(data, setData, db) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="sm:col-span-2">
            <Select
              label="Projeto" value={String(data.projetoId ?? '')} onChange={e => setData({...data, projetoId: toNumber(e.target.value)})} required
              options={db.projetos.map(p => ({ value: p.id, label: `${p.codigo} - ${p.titulo}` }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Select
              label="Participante" value={String(data.participanteId ?? '')} onChange={e => setData({...data, participanteId: toNumber(e.target.value)})} required
              options={db.participantes.map(p => ({ value: p.id, label: `${p.nome} (${p.cpf}) - ${labelTipoParticipante(p.tipo)}` }))}
            />
          </div>
          <Input label="Função Desempenhada (ex: Colaborador, Bolsista)" value={data.funcao || ''} onChange={e => setData({...data, funcao: e.target.value})} required />
          <div className="hidden"></div>
          <Input type="date" label="Data de Entrada" value={data.dataEntrada || ''} onChange={e => setData({...data, dataEntrada: e.target.value})} required />
          <Input type="date" label="Data de Saída (Vazio = Atual)" value={data.dataSaida || ''} onChange={e => setData({...data, dataSaida: e.target.value})} />
        </div>
      )}
    />
  );
};

const FinanciamentosProjetoView: React.FC<ViewProps> = ({ db, actions, showMessage, podeGerenciar }) => {
  return (
    <CrudView<FinanciamentoProjeto>
      title="Associação de Financiamento"
      items={db.financiamentosProjeto}
      {...collectionActions(actions, 'financiamentosProjeto')}
      db={db} showMessage={showMessage} podeGerenciar={podeGerenciar}
      getInitialForm={() => ({ financiamentoId: undefined, projetoId: undefined, tipoApoio: 'Total', valorApoio: undefined })}
      columns={[
        { header: 'ID', accessor: 'id' },
        { header: 'Agência/Fomento', render: row => {
            const f = db.financiamentos.find(f => f.id === row.financiamentoId);
            return f ? `${f.agencia} - ${f.tipoFomento}` : 'N/A';
          }
        },
        { header: 'Projeto', render: row => db.projetos.find(p => p.id === row.projetoId)?.codigo || 'N/A' },
        { header: 'Tipo Apoio', accessor: 'tipoApoio' },
        { header: 'Valor Destinado', render: row => formatCurrency(row.valorApoio) }
      ]}
      renderForm={(data, setData, db) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="sm:col-span-2">
            <Select
              label="Financiamento" value={String(data.financiamentoId ?? '')} onChange={e => setData({...data, financiamentoId: toNumber(e.target.value)})} required
              options={db.financiamentos.map(f => ({ value: f.id, label: `${f.agencia} - ${f.tipoFomento} (${formatCurrency(f.valorTotal)})` }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Select
              label="Projeto Apoiado" value={String(data.projetoId ?? '')} onChange={e => setData({...data, projetoId: toNumber(e.target.value)})} required
              options={db.projetos.map(p => ({ value: p.id, label: `${p.codigo} - ${p.titulo}` }))}
            />
          </div>
          <Select
            label="Tipo de Apoio" value={String(data.tipoApoio || '')} onChange={e => setData({...data, tipoApoio: e.target.value as TipoApoio})} required
            options={[ {value: 'Total', label: 'Total'}, {value: 'Parcial', label: 'Parcial'} ]}
          />
          <Input type="number" min="0" step="0.01" label="Valor do Apoio (R$)" value={String(data.valorApoio ?? '')} onChange={e => setData({...data, valorApoio: toNumber(e.target.value)})} required />
        </div>
      )}
    />
  );
};

const AutoresProducaoView: React.FC<ViewProps> = ({ db, actions, showMessage, podeGerenciar }) => {
  return (
    <CrudView<AutorProducao>
      title="Autoridade de Produção"
      items={db.autoresProducao}
      {...collectionActions(actions, 'autoresProducao')}
      db={db} showMessage={showMessage} podeGerenciar={podeGerenciar}
      getInitialForm={() => ({ producaoId: undefined, participanteId: undefined, tipoParticipacao: 'Autor Principal', dataInicio: '', dataTermino: '' })}
      validate={data => {
        if (!isDateRangeValid(data.dataInicio, data.dataTermino)) return 'A data de término não pode ser anterior à data de início.';
        return null;
      }}
      columns={[
        { header: 'Produção Científica', render: row => db.producoes.find(p => p.id === row.producaoId)?.titulo || 'N/A' },
        { header: 'Autor (Participante)', render: row => db.participantes.find(p => p.id === row.participanteId)?.nome || 'N/A' },
        { header: 'Tipo Participação', accessor: 'tipoParticipacao' }
      ]}
      detailColumns={[
        { header: 'Produção Científica', render: row => db.producoes.find(p => p.id === row.producaoId)?.titulo || 'N/A' },
        { header: 'Autor (Participante)', render: row => db.participantes.find(p => p.id === row.participanteId)?.nome || 'N/A' },
        { header: 'Tipo Participação', accessor: 'tipoParticipacao' },
        { header: 'Início do Vínculo', render: row => formatDate(row.dataInicio) },
        { header: 'Término', render: row => formatDate(row.dataTermino) }
      ]}
      renderForm={(data, setData, db) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <div className="sm:col-span-2">
            <Select
              label="Produção Científica" value={String(data.producaoId ?? '')} onChange={e => setData({...data, producaoId: toNumber(e.target.value)})} required
              options={db.producoes.map(p => ({ value: p.id, label: `${p.id} - ${p.titulo} (${p.ano})` }))}
            />
          </div>
          <div className="sm:col-span-2">
            <Select
              label="Autor (Participante Cadastrado)" value={String(data.participanteId ?? '')} onChange={e => setData({...data, participanteId: toNumber(e.target.value)})} required
              options={db.participantes.map(p => ({ value: p.id, label: `${p.nome} - ${labelTipoParticipante(p.tipo)}` }))}
            />
          </div>
          <Input label="Tipo de Participação (ex: Autor Principal, Coautor)" value={data.tipoParticipacao || ''} onChange={e => setData({...data, tipoParticipacao: e.target.value})} required />
          <div className="hidden"></div>
          <Input type="date" label="Data de Início do Vínculo" value={data.dataInicio || ''} onChange={e => setData({...data, dataInicio: e.target.value})} required />
          <Input type="date" label="Data de Término" value={data.dataTermino || ''} onChange={e => setData({...data, dataTermino: e.target.value})} />
        </div>
      )}
    />
  );
};

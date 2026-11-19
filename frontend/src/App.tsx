'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  LayoutDashboard, Users, FolderOpen, DollarSign,
  BookOpen, Link as LinkIcon, Briefcase, FileText,
  LogOut, Plus, Edit, Trash2, Search, AlertCircle, Check, Menu, X
} from 'lucide-react';
import {
  usuarioPadrao,
  TIPO_PARTICIPANTE_LABEL, SITUACAO_PROJETO_LABEL,
} from './Utils';
import { useResearchData } from './hooks/useResearchData';
import type { ResearchActions } from './hooks/useResearchData';
import type { CollectionName, RecordOf } from './services/research';
import { getApiErrorMessage } from './services/http';
import type {
  Database, Participante, Projeto, Financiamento, Producao,
  VinculoParticipacao, FinanciamentoProjeto, AutorProducao,
  TipoParticipante, SituacaoProjeto, TipoApoio,
} from './Utils';

// --- TYPES ---
type MessageType = 'success' | 'error';
type MessageData = { type: MessageType; text: string } | null;
type ShowMessage = (type: MessageType, text: string) => void;

interface ViewProps {
  db: Database;
  actions: ResearchActions;
  showMessage: ShowMessage;
}

// --- UI COMPONENTS ---
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  icon?: React.ElementType;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, variant = 'primary', type = 'button', className = '', icon: Icon, ...props }) => {
  const baseStyle = "px-4 py-2 border rounded-none font-medium flex items-center justify-center gap-2 focus:outline-none transition-colors text-sm";
  const variants = {
    primary: "bg-blue-900 border-blue-950 text-white hover:bg-blue-800",
    secondary: "bg-gray-200 border-gray-400 text-gray-900 hover:bg-gray-300",
    danger: "bg-red-700 border-red-800 text-white hover:bg-red-600"
  };
  return (
    <button type={type} onClick={onClick} className={`${baseStyle} ${variants[variant]} ${className}`} {...props}>
      {Icon && <Icon size={16} />}
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Input: React.FC<InputProps> = ({ label, name, type = 'text', value, onChange, required, disabled, placeholder, min, max, step }) => (
  <div className="flex flex-col mb-3">
    <label className="text-sm font-bold text-gray-700 mb-1">{label} {required && <span className="text-red-600">*</span>}</label>
    <input
      type={type} name={name} value={value ?? ''} onChange={onChange} required={required} disabled={disabled} placeholder={placeholder} min={min} max={max} step={step}
      className="w-full min-w-0 border border-gray-400 p-2 text-sm rounded-none focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 disabled:bg-gray-100 disabled:text-gray-500"
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: { value: string | number; label: string }[];
}

const Select: React.FC<SelectProps> = ({ label, name, value, onChange, required, options, disabled }) => (
  <div className="flex flex-col mb-3">
    <label className="text-sm font-bold text-gray-700 mb-1">{label} {required && <span className="text-red-600">*</span>}</label>
    <select
      name={name} value={value ?? ''} onChange={onChange} required={required} disabled={disabled}
      className="w-full min-w-0 border border-gray-400 p-2 text-sm rounded-none focus:outline-none focus:border-blue-900 bg-white disabled:bg-gray-100"
    >
      <option value="">Selecione...</option>
      {options.map((opt, i) => (
        <option key={i} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

interface Column<T> {
  header: string;
  accessor?: keyof T;
  render?: (row: T) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  onEdit?: (row: T) => void;
  onDelete?: (row: T) => void;
}

function Table<T extends { id: number }>({ columns, data, onEdit, onDelete }: TableProps<T>) {
  const renderCell = (row: T, col: Column<T>) =>
    col.render ? col.render(row) : (col.accessor ? String(row[col.accessor] ?? '') : '');

  const renderActions = (row: T) => (
    <>
      {onEdit && <button onClick={() => onEdit(row)} className="text-blue-700 hover:text-blue-900 p-1 bg-blue-50 border border-blue-200 hover:bg-blue-100" title="Editar"><Edit size={16}/></button>}
      {onDelete && <button onClick={() => onDelete(row)} className="text-red-700 hover:text-red-900 p-1 bg-red-50 border border-red-200 hover:bg-red-100" title="Excluir"><Trash2 size={16}/></button>}
    </>
  );

  return (
    <>
    {/* Telas pequenas: cada registro é exibido como um cartão */}
    <div className="md:hidden space-y-3">
      {data.length === 0 ? (
        <div className="p-4 text-center text-sm text-gray-500 bg-white border border-gray-300">Nenhum registro encontrado.</div>
      ) : (
        data.map((row) => (
          <div key={row.id} className="bg-white border border-gray-300 text-sm">
            <dl className="divide-y divide-gray-200">
              {columns.map((col, colIndex) => (
                <div key={colIndex} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-2 px-3 py-2">
                  <dt className="font-bold text-gray-600">{col.header}</dt>
                  <dd className="text-gray-800 break-words">{renderCell(row, col)}</dd>
                </div>
              ))}
            </dl>
            {(onEdit || onDelete) && (
              <div className="flex justify-end gap-2 px-3 py-2 bg-gray-50 border-t border-gray-200">
                {renderActions(row)}
              </div>
            )}
          </div>
        ))
      )}
    </div>

    <div className="hidden md:block overflow-x-auto border border-gray-300">
      <table className="w-full text-sm text-left border-collapse">
        <thead className="bg-gray-200 text-gray-700 border-b border-gray-400">
          <tr>
            {columns.map((col, i) => (
              <th key={i} className="p-3 border-r border-gray-300 font-bold whitespace-nowrap">{col.header}</th>
            ))}
            {(onEdit || onDelete) && <th className="p-3 font-bold text-center w-24">Ações</th>}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (onEdit || onDelete ? 1 : 0)} className="p-4 text-center text-gray-500 bg-white">Nenhum registro encontrado.</td>
            </tr>
          ) : (
            data.map((row) => (
              <tr key={row.id} className="border-b border-gray-200 hover:bg-gray-50 bg-white">
                {columns.map((col, colIndex) => (
                  <td key={colIndex} className="p-3 border-r border-gray-200 text-gray-800">
                    {renderCell(row, col)}
                  </td>
                ))}
                {(onEdit || onDelete) && (
                  <td className="p-2">
                    <div className="flex justify-center gap-2">{renderActions(row)}</div>
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
  onClose: () => void;
}

const Message: React.FC<MessageComponentProps> = ({ type, message, onClose }) => {
  if (!message) return null;
  const isError = type === 'error';
  return (
    <div className={`p-3 mb-4 border ${isError ? 'bg-red-50 border-red-500 text-red-900' : 'bg-green-50 border-green-500 text-green-900'} flex items-center justify-between gap-2`}>
      <div className="flex items-center gap-2 min-w-0">
        {isError ? <AlertCircle size={18} className="flex-shrink-0" /> : <Check size={18} className="flex-shrink-0" />}
        <span className="text-sm font-medium">{message}</span>
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-900 font-bold">&times;</button>
    </div>
  );
};

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

// --- MAIN APPLICATION COMPONENT ---
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
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
  const { db, actions } = useResearchData(isLoggedIn, currentRoute, showMessage);

  if (!isLoggedIn) {
    return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;
  }

  const navigate = (route: string) => {
    setCurrentRoute(route);
    setMessage(null);
    setSidebarOpen(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setSidebarOpen(false);
    setCurrentRoute('dashboard');
    setMessage(null);
  };

  const renderContent = () => {
    switch (currentRoute) {
      case 'dashboard': return <Dashboard db={db} />;
      case 'projetos': return <ProjetosView db={db} actions={actions} showMessage={showMessage} />;
      case 'participantes': return <ParticipantesView db={db} actions={actions} showMessage={showMessage} />;
      case 'financiamentos': return <FinanciamentosView db={db} actions={actions} showMessage={showMessage} />;
      case 'producoes': return <ProducoesView db={db} actions={actions} showMessage={showMessage} />;
      case 'vinculos': return <VinculosParticipacaoView db={db} actions={actions} showMessage={showMessage} />;
      case 'financiamentosProjeto': return <FinanciamentosProjetoView db={db} actions={actions} showMessage={showMessage} />;
      case 'autores': return <AutoresProducaoView db={db} actions={actions} showMessage={showMessage} />;
      default: return <Dashboard db={db} />;
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
            <h1 className="text-white font-bold text-lg leading-tight uppercase tracking-wide">SIGPesq</h1>
            <p className="text-xs text-gray-500 mt-1">Gestão de Projetos</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 text-gray-400 hover:text-white" title="Fechar menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          <MenuLink icon={LayoutDashboard} label="Painel Inicial" active={currentRoute === 'dashboard'} onClick={() => navigate('dashboard')} />
          <MenuLink icon={FolderOpen} label="Projetos de pesquisa" active={currentRoute === 'projetos'} onClick={() => navigate('projetos')} />
          <MenuLink icon={Users} label="Participantes" active={currentRoute === 'participantes'} onClick={() => navigate('participantes')} />
          <MenuLink icon={DollarSign} label="Financiamentos" active={currentRoute === 'financiamentos'} onClick={() => navigate('financiamentos')} />
          <MenuLink icon={BookOpen} label="Produções científicas" active={currentRoute === 'producoes'} onClick={() => navigate('producoes')} />
          <div className="my-2 border-t border-gray-800"></div>
          <p className="px-4 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">Associações</p>
          <MenuLink icon={Briefcase} label="Vínculos de participação" active={currentRoute === 'vinculos'} onClick={() => navigate('vinculos')} />
          <MenuLink icon={LinkIcon} label="Financiamentos por projeto" active={currentRoute === 'financiamentosProjeto'} onClick={() => navigate('financiamentosProjeto')} />
          <MenuLink icon={FileText} label="Autores das produções" active={currentRoute === 'autores'} onClick={() => navigate('autores')} />
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors w-full p-2">
            <LogOut size={16} /> Sair do sistema
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="bg-white border-b border-gray-300 px-4 py-3 md:px-6 md:py-4 flex justify-between items-center gap-3 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-1 -ml-1 text-gray-700 hover:text-gray-900" title="Abrir menu">
              <Menu size={22} />
            </button>
            <h2 className="text-lg md:text-xl font-bold text-gray-800 capitalize truncate">
              {currentRoute.replace(/([A-Z])/g, ' $1').trim()}
            </h2>
          </div>
          <div className="text-sm text-gray-600 min-w-0 truncate">
            <span className="hidden sm:inline">Usuário: </span><span className="font-bold">{usuarioPadrao.nome}</span>
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
    className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors border-l-4 ${
      active ? 'bg-blue-900 text-white border-blue-500' : 'border-transparent hover:bg-gray-800 hover:text-gray-100'
    }`}
  >
    <Icon size={18} />
    {label}
  </button>
);

// --- VIEWS ---

const LoginScreen: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Versão temporária: sem autenticação, o botão Entrar libera o acesso imediatamente.
    onLogin();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 px-4 py-8">
      <div className="bg-white border border-gray-400 p-6 sm:p-8 w-full max-w-md shadow-none rounded-none">
        <div className="text-center mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 uppercase">SIGPesq</h1>
          <p className="text-sm text-gray-600">Projetos de Pesquisa Universitários</p>
        </div>
        
        {/* noValidate: o e-mail é opcional e não deve bloquear o acesso com valor em formato inválido */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <Input 
            label="E-mail Institucional" 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="Ex: admin@instituicao.edu.br"
          />
          <Input 
            label="Senha" 
            type="password" 
            value={senha} 
            onChange={(e) => setSenha(e.target.value)} 
            placeholder="Qualquer senha permite acesso"
          />
          <div className="pt-2">
            <Button type="submit" className="w-full">Entrar</Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ db: Database }> = ({ db }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-5 border border-gray-300">
        <h3 className="text-lg font-bold border-b border-gray-300 pb-2 mb-4">Visão Geral do Sistema</h3>
        <p className="text-sm text-gray-700 mb-6">
          Sistema administrativo para gerenciamento de projetos de pesquisa universitários, participantes, financiamentos e produções científicas associadas.
        </p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard title="Projetos" value={db.projetos.length} />
          <StatCard title="Participantes" value={db.participantes.length} />
          <StatCard title="Financiamentos" value={db.financiamentos.length} />
          <StatCard title="Produções" value={db.producoes.length} />
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ title: string; value: number }> = ({ title, value }) => (
  <div className="border border-gray-400 bg-gray-50 p-3 sm:p-4 text-center rounded-none shadow-none min-w-0">
    <div className="text-2xl sm:text-3xl font-bold text-blue-900 mb-1">{value}</div>
    <div className="text-[11px] sm:text-xs font-bold text-gray-600 uppercase tracking-wide sm:tracking-wider break-words">{title}</div>
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
  getInitialForm: () => Partial<T>;
  // Retorna uma mensagem de erro quando os dados do formulário são inválidos.
  validate?: (data: Partial<T>, items: T[]) => string | null;
}

function CrudView<T extends { id: number }>({ title, items, onSave, onDelete, db, columns, renderForm, showMessage, getInitialForm, validate }: CrudViewProps<T>) {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<T>>({});
  const pending = useRef(false);

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
    }
  };

  if (view === 'form') {
    return (
      <div className="bg-white border border-gray-300 p-4 sm:p-6 rounded-none">
        <h3 className="text-base sm:text-lg font-bold border-b border-gray-300 pb-2 mb-4 uppercase break-words">
          {formData.id ? `Editar ${title}` : `Novo ${title}`}
        </h3>
        <form onSubmit={handleSalvar}>
          {renderForm(formData, setFormData, db)}
          <div className="flex flex-col sm:flex-row gap-2 mt-6 pt-4 border-t border-gray-300 bg-gray-50 -mx-4 -mb-4 sm:-mx-6 sm:-mb-6 p-4">
            <Button type="submit" icon={Check} className="w-full sm:w-auto">Salvar Dados</Button>
            <Button variant="secondary" onClick={() => setView('list')} className="w-full sm:w-auto">Cancelar</Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-white p-4 border border-gray-300 rounded-none">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <Search size={18} className="text-gray-500" />
          <input
            type="text"
            placeholder="Pesquisar registros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full border-b border-gray-400 py-1 text-sm focus:outline-none focus:border-blue-900"
          />
        </div>
        <Button onClick={handleNovo} icon={Plus} className="w-full sm:w-auto flex-shrink-0">Novo Registro</Button>
      </div>
      <Table columns={columns} data={filteredData} onEdit={handleEditar} onDelete={handleExcluir} />
    </div>
  );
}


// --- SPECIFIC VIEWS ---

const ProjetosView: React.FC<ViewProps> = ({ db, actions, showMessage }) => {
  return (
    <CrudView<Projeto>
      title="Projeto"
      items={db.projetos}
      {...collectionActions(actions, 'projetos')}
      db={db} showMessage={showMessage}
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

const ParticipantesView: React.FC<ViewProps> = ({ db, actions, showMessage }) => {
  return (
    <CrudView<Participante>
      title="Participante"
      items={db.participantes}
      {...collectionActions(actions, 'participantes')}
      db={db} showMessage={showMessage}
      getInitialForm={() => ({ nome: '', email: '', cpf: '', tipo: 'Docente' })}
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
      renderForm={(data, setData) => (
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
            options={[ {value: 'Docente', label: 'Docente'}, {value: 'Discente', label: 'Discente'}, {value: 'Tecnico', label: 'Técnico'} ]}
          />
        </div>
      )}
    />
  );
};

const FinanciamentosView: React.FC<ViewProps> = ({ db, actions, showMessage }) => {
  return (
    <CrudView<Financiamento>
      title="Financiamento"
      items={db.financiamentos}
      {...collectionActions(actions, 'financiamentos')}
      db={db} showMessage={showMessage}
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

const ProducoesView: React.FC<ViewProps> = ({ db, actions, showMessage }) => {
  return (
    <CrudView<Producao>
      title="Produção Científica"
      items={db.producoes}
      {...collectionActions(actions, 'producoes')}
      db={db} showMessage={showMessage}
      getInitialForm={() => ({ titulo: '', tipo: 'Artigo', ano: undefined, meioDivulgacao: '', projetoId: undefined })}
      columns={[
        { header: 'ID', accessor: 'id' },
        { header: 'Título', accessor: 'titulo' },
        { header: 'Tipo', accessor: 'tipo' },
        { header: 'Ano', accessor: 'ano' },
        { header: 'Projeto Relacionado', render: row => db.projetos.find(p => p.id === row.projetoId)?.codigo || 'N/A' }
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

const VinculosParticipacaoView: React.FC<ViewProps> = ({ db, actions, showMessage }) => {
  return (
    <CrudView<VinculoParticipacao>
      title="Vínculo de Participação"
      items={db.vinculosParticipacao}
      {...collectionActions(actions, 'vinculosParticipacao')}
      db={db} showMessage={showMessage}
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

const FinanciamentosProjetoView: React.FC<ViewProps> = ({ db, actions, showMessage }) => {
  return (
    <CrudView<FinanciamentoProjeto>
      title="Associação de Financiamento"
      items={db.financiamentosProjeto}
      {...collectionActions(actions, 'financiamentosProjeto')}
      db={db} showMessage={showMessage}
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

const AutoresProducaoView: React.FC<ViewProps> = ({ db, actions, showMessage }) => {
  return (
    <CrudView<AutorProducao>
      title="Autoridade de Produção"
      items={db.autoresProducao}
      {...collectionActions(actions, 'autoresProducao')}
      db={db} showMessage={showMessage}
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

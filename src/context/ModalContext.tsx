import { createContext, useState } from 'react';
import type { ReactNode } from 'react';
import { Modal } from '../components/common/Modal';

type ModalResult = boolean;

type ShowModalOptions = {
  title?: string;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  showCancel?: boolean;
};

type ModalContextType = {
  showModal: (opts: ShowModalOptions) => Promise<ModalResult>;
  showPrompt: (message: ReactNode, title?: string) => Promise<ModalResult>;
  hideModal: () => void;
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<ReactNode | undefined>(undefined);
  const [confirmLabel, setConfirmLabel] = useState('OK');
  const [cancelLabel, setCancelLabel] = useState('Cancel');
  const [showCancel, setShowCancel] = useState(false);
  const [resolver, setResolver] = useState<((value: ModalResult) => void) | null>(null);

  const close = (result: ModalResult) => {
    setOpen(false);
    if (resolver) {
      resolver(result);
      setResolver(null);
    }
  };

  const showModal = (opts: ShowModalOptions) => {
    return new Promise<ModalResult>((resolve) => {
      setTitle(opts.title);
      setMessage(opts.message);
      setConfirmLabel(opts.confirmLabel || 'OK');
      setCancelLabel(opts.cancelLabel || 'Cancel');
      setShowCancel(Boolean(opts.showCancel));
      setResolver(() => resolve);
      setOpen(true);
    });
  };

  const showPrompt = (msg: ReactNode, t?: string) => showModal({ message: msg, title: t, showCancel: true, confirmLabel: 'Yes', cancelLabel: 'No' });

  const hideModal = () => {
    close(false);
  };

  return (
    <ModalContext.Provider value={{ showModal, showPrompt, hideModal }}>
      {children}

      <Modal
        isOpen={open}
        onClose={() => close(false)}
        title={title}
        footer={(
          <div className="flex gap-3 justify-end">
            {showCancel && (
              <button
                onClick={() => close(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                {cancelLabel}
              </button>
            )}
            <button
              onClick={() => close(true)}
              className="px-4 py-2 rounded-xl bg-primary-600 text-white hover:bg-primary-700"
            >
              {confirmLabel}
            </button>
          </div>
        )}
      >
        <div className="prose max-w-none">
          {message}
        </div>
      </Modal>
    </ModalContext.Provider>
  );
};

export default ModalContext;

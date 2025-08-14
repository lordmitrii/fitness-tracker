import CloseIcon from "../../icons/CloseIcon";
import Modal from "../Modal";

const QuestionMarkTooltipModal = ({ text, onClose }) => {
  return (
    <>
      <Modal onRequestClose={onClose}>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-700 hover:text-gray-900 transition"
          >
            <CloseIcon />
          </button>
        </div>
        <div className="mt-2">{text}</div>
      </Modal>
    </>
  );
};

export default QuestionMarkTooltipModal;

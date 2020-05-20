;;; deno-fmt.el --- Minor mode for using deno fmt on save
;;
;; Copyright (C) 2020 Russell Clarey. All rights reserved. MIT license.
;;
;; Author: Russell Clarey <http://github/rclarey>
;; Version: 0.1.0
;; Keywords: deno format
;; Homepage: https://github.com/russell/deno-emacs
;;
;; This file is not part of GNU Emacs.
;;
;;; Commentary:
;; Formats your TypeScript/JavaScript code with deno fmt on save
;;
;;; Code:

(defun deno-fmt ()
  "Format buffer with `deno fmt'."
  (interactive)
  (if (not (executable-find "deno"))
      (error "deno executable not found. Visit \"https://deno.land/#installation\" for installation instructions")
    (let ((tempfile (make-temp-file "deno-fmt-temp" nil ".ts"))
          (outbuffer (get-buffer-create "*deno-fmt-temp.ts*")))
      (unwind-protect
          (progn
            (with-current-buffer outbuffer (erase-buffer))
            (write-region nil nil tempfile)
            (if (zerop (call-process "deno" nil outbuffer nil "fmt" tempfile))
                (let ((p (point)))
                  (save-excursion
                    (with-current-buffer (current-buffer)
                      (erase-buffer)
                      (insert-file-contents tempfile)))
                  (goto-char p)
                  (message "deno-fmt: formatted")
                  (kill-buffer outbuffer))
              (progn
                (message "deno-fmt: failed")
                (display-buffer outbuffer))))
        (delete-file tempfile)))))

;;;###autoload
(define-minor-mode deno-fmt-mode
  "Runs `deno fmt' on save when enabled"
  :lighter " deno-fmt"
  :global nil
  (if deno-fmt-mode
      (add-hook 'before-save-hook 'deno-fmt nil 'local)
    (remove-hook 'before-save-hook 'deno-fmt 'local)))

(provide 'deno-fmt)
;;; deno-fmt.el ends here

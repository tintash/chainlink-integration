;; Oracle callback trait
(define-trait oracle-callback
    (
        ;; Called when oracle request is fulfilled
        (oracle-callback-handler ((optional (buff 128))) (response bool uint))
    )
)


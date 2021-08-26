;; consumer

(define-data-var data-value (optional (buff 128)) none)

(impl-trait .oracle.oracle-callback)
(use-trait oracle-callback .oracle.oracle-callback)

(define-public (oracle-callback-handler (value  (optional (buff 128))))
  (begin
    (var-set data-value value)
    (ok u200)))

(define-read-only (read-data-value)
  (ok (var-get data-value)))


(define-public (create-request                    
                    (job-spec-id (buff 66)) 
                    (sender-id-buff (buff 84)) 
                    (data (buff 1024)) 
                    (callback <oracle-callback>))                  
  (contract-call? 
    .stxlink-token 
    transfer-and-call
    job-spec-id
    sender-id-buff
    data
    callback ))
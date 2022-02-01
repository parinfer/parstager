#!/usr/bin/env bb

(ns user.parstager
  (:require
    [clojure.string :refer [split-lines]]
    [clojure.java.shell :refer [sh]]
    [rewrite-clj.zip :as z]))

(defn orig-source [fname] (:out (sh "git" "show" (str "HEAD:./" fname))))
(defn changed-files [] (split-lines (:out (sh "git" "diff" "--name-only"))))

(defn process-fname [fname]
  (println fname)
  (let [prev (sexprs->src (z/of-string (orig-source fname)))
        curr (z/of-string (slurp fname))]))

(defn main []
  (doseq [fname (changed-files)]
    (process-fname fname)))

(defn sexprs->src [zloc]
  (->> zloc
       (iterate z/right)
       (take-while (complement z/end?))
       (map (juxt z/sexpr z/string))
       (into {})))

(comment
  (def fname "parstager.clj")
  (def curr (z/of-string (slurp fname) {:track-position? true}))
  (sexprs->src curr)
  (doseq [p (all-forms curr)]
    (prn (z/string p))))

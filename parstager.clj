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
  (let [prev (z/of-string (orig-source fname))
        curr (z/of-string (slurp fname))]))

(defn main []
  (doseq [fname (changed-files)]
    (process-fname fname)))

(defn all-forms [zloc]
  (loop [forms [] zloc zloc]
    (if (z/end? zloc)
      forms
      (recur (conj forms zloc)
             (z/right zloc)))))

(comment
  (def fname "parstager.clj")
  (def curr (z/of-string (slurp fname) {:track-position? true}))
  (doseq [p (all-forms curr)]
    (prn (z/string p))))

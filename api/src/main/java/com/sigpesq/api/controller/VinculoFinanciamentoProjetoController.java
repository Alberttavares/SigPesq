package com.sigpesq.api.controller;

import java.util.List;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.sigpesq.api.model.VinculoFinanciamentoProjeto;
import com.sigpesq.api.repository.VinculoFinanciamentoProjetoRepository;

@RestController
@RequestMapping("/api/vinculos-financiamento")
@CrossOrigin(origins = "http://localhost:3000")
public class VinculoFinanciamentoProjetoController {

    private final VinculoFinanciamentoProjetoRepository repository;

    public VinculoFinanciamentoProjetoController(VinculoFinanciamentoProjetoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<VinculoFinanciamentoProjeto>> listar() {
        return ResponseEntity.ok(repository.listarTodos());
    }

    @GetMapping("/projeto/{codigoProjeto}")
    public ResponseEntity<List<VinculoFinanciamentoProjeto>> listarPorProjeto(@PathVariable String codigoProjeto) {
        return ResponseEntity.ok(repository.buscarPorProjeto(codigoProjeto));
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody VinculoFinanciamentoProjeto vinculo) {
        try {
            repository.salvar(vinculo);
            return ResponseEntity.status(HttpStatus.CREATED).body("Financiamento vinculado ao projeto com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro: Este financiamento já está vinculado a este projeto.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Erro: Financiamento ou projeto não encontrado.");
        }
    }

    @PutMapping("/{idFinanciamento}/{codigoProjeto}")
    public ResponseEntity<?> atualizar(
            @PathVariable int idFinanciamento,
            @PathVariable String codigoProjeto,
            @RequestBody VinculoFinanciamentoProjeto vinculo) {
        try {
            int linhasAfetadas = repository.atualizar(idFinanciamento, codigoProjeto, vinculo);
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Valor alocado atualizado com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{idFinanciamento}/{codigoProjeto}")
    public ResponseEntity<?> deletar(
            @PathVariable int idFinanciamento,
            @PathVariable String codigoProjeto) {
        int linhasAfetadas = repository.deletar(idFinanciamento, codigoProjeto);
        if (linhasAfetadas == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
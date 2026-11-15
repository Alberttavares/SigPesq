package com.sigpesq.api.controller;

import com.sigpesq.api.model.VinculoParticipacaoProjeto;
import com.sigpesq.api.repository.VinculoParticipacaoProjetoRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vinculos-projeto")
@CrossOrigin(origins = "http://localhost:3000")
public class VinculoParticipacaoProjetoController {

    private final VinculoParticipacaoProjetoRepository repository;

    public VinculoParticipacaoProjetoController(VinculoParticipacaoProjetoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<VinculoParticipacaoProjeto>> listar() {
        return ResponseEntity.ok(repository.listarTodos());
    }

    @GetMapping("/projeto/{codigoProjeto}")
    public ResponseEntity<List<VinculoParticipacaoProjeto>> listarPorProjeto(@PathVariable String codigoProjeto) {
        return ResponseEntity.ok(repository.buscarPorProjeto(codigoProjeto));
    }

    @PostMapping
    public ResponseEntity<?> criar(@RequestBody VinculoParticipacaoProjeto vinculo) {
        try {
            repository.salvar(vinculo);
            return ResponseEntity.status(HttpStatus.CREATED).body("Vínculo de participação cadastrado com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro: Este participante já está vinculado a este projeto.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest()
                    .body("Erro: CPF do participante ou código do projeto não encontrado.");
        }
    }

    @PutMapping("/{codigoProjeto}/{cpfParticipante}")
    public ResponseEntity<?> atualizar(
            @PathVariable String codigoProjeto,
            @PathVariable String cpfParticipante,
            @RequestBody VinculoParticipacaoProjeto vinculo) {
        try {
            int linhasAfetadas = repository.atualizar(codigoProjeto, cpfParticipante, vinculo);
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Vínculo atualizado com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @DeleteMapping("/{codigoProjeto}/{cpfParticipante}")
    public ResponseEntity<?> deletar(
            @PathVariable String codigoProjeto,
            @PathVariable String cpfParticipante) {
        int linhasAfetadas = repository.deletar(codigoProjeto, cpfParticipante);
        if (linhasAfetadas == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
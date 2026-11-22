package com.sigpesq.api.controller;

import com.sigpesq.api.model.VinculoParticipanteProducao;
import com.sigpesq.api.repository.VinculoParticipanteProducaoRepository;
import com.sigpesq.api.dto.VinculoParticipanteProducaoRequest;
import jakarta.validation.Valid;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vinculos-producao")
@CrossOrigin(origins = "http://localhost:3000")
public class VinculoParticipanteProducaoController {

    private final VinculoParticipanteProducaoRepository repository;

    public VinculoParticipanteProducaoController(VinculoParticipanteProducaoRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public ResponseEntity<List<VinculoParticipanteProducao>> listar() {
        return ResponseEntity.ok(repository.listarTodos());
    }

    @GetMapping("/producao/{idProducao}")
    public ResponseEntity<List<VinculoParticipanteProducao>> listarPorProducao(@PathVariable int idProducao) {
        return ResponseEntity.ok(repository.buscarPorProducao(idProducao));
    }

    @GetMapping("/participante/{cpfParticipante}")
    public ResponseEntity<List<VinculoParticipanteProducao>> listarPorParticipante(@PathVariable String cpfParticipante) {
        return ResponseEntity.ok(repository.buscarPorParticipante(cpfParticipante));
    }

@PostMapping
    public ResponseEntity<?> criar(@Valid @RequestBody VinculoParticipanteProducaoRequest request) {
        try {
            repository.salvar(request.toModel());
            return ResponseEntity.status(HttpStatus.CREATED).body("Autor vinculado à produção científica com sucesso.");
        } catch (DuplicateKeyException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Erro: Este participante já está cadastrado como autor desta produção.");
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Erro: Participante ou produção científica não encontrado.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao vincular autor: " + e.getMessage());
        }
    }

    @PutMapping("/{cpfParticipante}/{idProducao}")
    public ResponseEntity<?> atualizar(
            @PathVariable String cpfParticipante,
            @PathVariable int idProducao,
            @Valid @RequestBody VinculoParticipanteProducaoRequest request) {
        try {
            String cpfLimpo = cpfParticipante.replaceAll("\\D", "");
            int linhasAfetadas = repository.atualizar(cpfLimpo, idProducao, request.toModel());
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Vínculo de autoria atualizado com sucesso.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao atualizar vínculo: " + e.getMessage());
        }
    }

    @DeleteMapping("/{cpfParticipante}/{idProducao}")
    public ResponseEntity<?> deletar(
            @PathVariable String cpfParticipante,
            @PathVariable int idProducao) {
        int linhasAfetadas = repository.deletar(cpfParticipante, idProducao);
        if (linhasAfetadas == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
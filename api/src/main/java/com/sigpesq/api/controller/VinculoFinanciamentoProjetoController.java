package com.sigpesq.api.controller;

import com.sigpesq.api.model.VinculoFinanciamentoProjeto;
import com.sigpesq.api.repository.VinculoFinanciamentoProjetoRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/vinculos-financiamento")
@CrossOrigin(origins = "http://localhost:3000")
public class VinculoFinanciamentoProjetoController {

    private final VinculoFinanciamentoProjetoRepository repository;
    private static final List<String> TIPOS_APOIO_VALIDOS = List.of("Total", "Parcial");

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
        if (vinculo.getTipoApoio() == null || !TIPOS_APOIO_VALIDOS.contains(vinculo.getTipoApoio())) {
            return ResponseEntity.badRequest()
                    .body("Tipo de apoio inválido. Valores permitidos: 'Total' ou 'Parcial'.");
        }

        try {
            repository.salvar(vinculo);
            return ResponseEntity.status(HttpStatus.CREATED).body("Financiamento vinculado ao projeto com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (DataIntegrityViolationException e) {
            return ResponseEntity.badRequest().body("Erro: Financiamento ou projeto não encontrado.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao vincular financiamento: " + e.getMessage());
        }
    }

    @PutMapping("/{idVinculo}")
    public ResponseEntity<?> atualizar(
            @PathVariable int idVinculo,
            @RequestBody VinculoFinanciamentoProjeto vinculo) {
        if (vinculo.getTipoApoio() == null || !TIPOS_APOIO_VALIDOS.contains(vinculo.getTipoApoio())) {
            return ResponseEntity.badRequest()
                    .body("Tipo de apoio inválido. Valores permitidos: 'Total' ou 'Parcial'.");
        }

        try {
            int linhasAfetadas = repository.atualizar(idVinculo, vinculo);
            if (linhasAfetadas == 0) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok("Vínculo de financiamento atualizado com sucesso.");
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Erro ao atualizar vínculo: " + e.getMessage());
        }
    }

    @DeleteMapping("/{idVinculo}")
    public ResponseEntity<?> deletar(@PathVariable int idVinculo) {
        int linhasAfetadas = repository.deletar(idVinculo);
        if (linhasAfetadas == 0) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.noContent().build();
    }
}
package com.match.partner.openapi.views.controller;


import com.match.partner.openapi.views.model.dto.ViewsDto;
import com.match.partner.openapi.views.model.dto.ViewsRequest;
import com.match.partner.openapi.views.service.ViewsServiceInterface;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/views")
@RequiredArgsConstructor
public class ViewsController {
    private final ViewsServiceInterface viewsService;

    @PostMapping
    public ResponseEntity<String> addView(@RequestBody ViewsRequest request, @RequestAttribute("username") String userName) {
        viewsService.addView(request.getProfileId(), userName);
        return ResponseEntity.ok("View added successfully");
    }

    @GetMapping
    public ResponseEntity<List<ViewsDto>> getViews(@RequestAttribute("username") String userName) {
        List<ViewsDto> views = viewsService.getViews(userName);
        return ResponseEntity.ok(views);
    }
}

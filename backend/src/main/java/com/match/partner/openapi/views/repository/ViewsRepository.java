package com.match.partner.openapi.views.repository;



import com.match.partner.openapi.views.model.dao.Views;
import com.match.partner.openapi.views.model.dao.ViewsId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ViewsRepository extends JpaRepository<Views, ViewsId> {
    Page<Views> findByIdProfileIdOrderByViewedAtDesc(Integer profileId, Pageable pageable);
}

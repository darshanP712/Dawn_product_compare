class ProductCompare extends HTMLElement {
  constructor() {
    super();
    
    this.tabEl = this.querySelector('[data-tab]');
    this.overviewEl = this.querySelector('[data-overview]');
    this.titleEl = this.querySelectorAll('[data-title]');
    this.compareAllEl = this.querySelector('[data-compare-all]');
    this.clearEl = this.querySelector('[data-compare-clear]');
    this.resultsEl = this.querySelector('[data-results]');
    this.resultsCloseEl = this.resultsEl.querySelector('[data-close]');
    this.onLoad();
    this.setupButtons();
   }

  onLoad() {
    this.products = localStorage.getItem(this.storageName) !== null ? JSON.parse(localStorage.getItem(this.storageName)) : [];
    
    if (this.products.length > 0) {
      this.getOverviewCards();
      this.tabEl.classList.add('active');
    }
    document.querySelector('[data-header-compare]').addEventListener('click', function () {
      document.querySelector('[data-tab]').classList.remove('active');
      document.querySelector('[data-overview]').classList.add('active');
    });

    this.tabEl.addEventListener('click', this.onTabClick.bind(this));
    this.titleEl.forEach((title) => title.addEventListener('click', this.onTitleClick.bind(this)));
    this.compareAllEl.addEventListener('click', this.onCompareAllClick.bind(this));
    this.clearEl.addEventListener('click', this.onClearClick.bind(this));
  }

  setupButtons() {    
    document.querySelectorAll('[data-compare]').forEach((button) => {
      const handle = button.dataset.compare;
      /**
       * Check if product already exists in localStorage
       */      
      if (this.products.includes(handle)) {
        button.classList.add('active');
        button.querySelector('[data-text]').textContent = 'Remove';
      }
       /**
       * Attach event listener
       */
      button.addEventListener('click', this.onCompareProductClick.bind(this));
   });
  }

  onTabClick() {
    this.tabEl.classList.remove('active');
    this.overviewEl.classList.add('active');
  }

  onTitleClick() {
    this.overviewEl.classList.remove('active');
    if (this.products.length > 0) {
      this.tabEl.classList.add('active');
    }
  }
  
  onCompareProductClick(e) {
    const button = e.target.closest('[data-compare]');
    const handle = button.dataset.compare;

    if (button.classList.contains('active')) {
      this.remove(handle);

      if (!this.overviewEl.classList.contains('active')) {
        this.overviewEl.classList.add('active');
        this.tabEl.classList.remove('active');
      }
    } else {

      this.add(handle);
      if (!this.overviewEl.classList.contains('active')) {
        this.overviewEl.classList.add('active');
        this.tabEl.classList.remove('active');
      }
    }
  }

  onCompareAllClick() {
    if (this.products.length < 2) {
      const customDivError  = document.querySelector('.product-list-comapre-error');
      customDivError.innerHTML = '<p class="active">Please select at least 2 products</p>';
      setTimeout(() => {
       customDivError.innerHTML = '';
      }, 2000);
      return;
    }

   this.loadResults();
  }

  onClearClick() {
    this.overviewEl.querySelectorAll('[data-product-holder]').forEach((holder) => {
      holder.classList.remove('active');
      holder.innerHTML ='<p class="onClearClick">Select a product to compare</p>';
    });
    this.products = [];
    document.querySelectorAll('[data-compare]').forEach((button) => {
      button.classList.remove('active');
      button.querySelector('[data-text]').textContent = 'Compare';
    });

    this.overviewEl.classList.remove('active');
  }
 add(handle) {
    if (this.products.length === 3) {

      const customDivError3  = document.querySelector('.product-list-comapre-error');
      customDivError3.innerHTML = `
        <p class="active">Max products added</p>
        <p class="active">You already have 3 products to compare, please remove one to add a new product.</p>
      `;

      setTimeout(() => {
       customDivError3.innerHTML = '';
      }, 3000);

      return;
    }
      fetch(`/products/${handle}?section_id=product-compare-overview-card`)
      .then(response => response.text())
      .then((product) => {
        const holder = this.overviewEl.querySelector('[data-product-holder]:not(.active)');

        holder.innerHTML = '';
        holder.insertAdjacentHTML('afterbegin', product);
        holder.classList.add('active');
      
        document.querySelectorAll(`[data-compare="${handle}"]`).forEach((button) => {
          button.classList.add('active');
          button.querySelector('[data-text]').textContent = 'Remove';
        });

        document.querySelectorAll('[data-remove]').forEach((button) => {          
          button.addEventListener('click', this.onRemoveProductClick.bind(this));        
        });
        
        this.products = [...this.products, handle]; 
        
      })
      .catch(() => {
        const content = `<h3>Failed to add product</h3>
                          <p>Unfortunately we can't compare that product, please try again later.</p>`;
        this.createPopup(content);
      });
  }
  getOverviewCards() {
    this.products.forEach((handle) => {
      fetch(`/products/${handle}?section_id=product-compare-overview-card`)
        .then(response => response.text())
        .then((product) => {
          const holder = this.overviewEl.querySelector('[data-product-holder]:not(.active)');
          
          holder.innerHTML = '';
          holder.insertAdjacentHTML('afterbegin', product);
          holder.classList.add('active');

          document.querySelectorAll('[data-remove]').forEach((button) => {
              button.addEventListener('click', this.onRemoveProductClick.bind(this));          
          });
          
        })
        .catch(() => {
          this.products = this.products.filter((productHandle) => productHandle !== handle);
        });
    });
  }
 
  onRemoveProductClick(e) {
    
    const button = e.target.closest('[data-remove]');
    const handle = button.parentNode.parentNode.dataset.product;
    /**
     * Check if product already exists in localStorage  than remove product
     */ 
    if (this.products.includes(handle)) {
      this.remove(handle);
    }    
  }
  
  remove(handle) {
    const product = this.overviewEl.querySelector(`[data-product="${handle}"]`);
    const holder = product.closest('[data-product-holder]');
    product.remove();
    holder.innerHTML = '<p class="">Select a product to compare</p>';
    holder.classList.remove('active');

    const emptyHolder = this.overviewEl.querySelector('[data-product-holder]:not(.active)');
    emptyHolder.parentNode.appendChild(emptyHolder);

    document.querySelectorAll(`[data-compare="${handle}"]`).forEach((button) => {
      button.classList.remove('active');
      button.querySelector('[data-text]').textContent = 'Compare';
    });

    this.products = this.products.filter((productHandle) => productHandle !== handle);
  }

  createPopup(content) {
    this.popup = document.createElement('div');
    this.popup.className ='createPopup html';
    this.popup.innerHTML = `
      <button class="absolute top-5 right-5" data-close>
        <svg class="w-5 stroke-black stroke-[4]" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><g stroke-linecap="square" stroke-linejoin="miter" fill="none" stroke-miterlimit="10"><line x1="38" y1="10" x2="10" y2="38"></line> <line x1="38" y1="38" x2="10" y2="10"></line></g></svg>
      </button>  ${content}`;
    this.appendChild(this.popup);

    const close = () => {
      this.popup.remove();
      document.removeEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          close();
        }
      });
    };

    this.popup.querySelector('[data-close]').addEventListener('click', close);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        close();
      }
    });
  }

  closeResults() {
    document.body.classList.remove('overflow-hidden');
    this.resultsEl.classList.remove('active');
    this.resultsEl.querySelector('[data-products]').innerHTML = '';
    document.removeEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeResults();
      }
    });
  }

 loadResults() {
    const requests = this.products.map((handle) =>
      fetch(`/products/${handle}?section_id=product-compare-results-card`)
        .then(response => response.text())
        .then((product) => {
          this.resultsEl.querySelector('[data-products]').insertAdjacentHTML('beforeend', product);
        })
    );

    Promise.all(requests).then(() => {
      /**
       * Open results
       */
      this.resultsEl.classList.add('active');
      this.overviewEl.classList.remove('active');
      this.tabEl.classList.add('active');
      document.body.classList.add('overflow-hidden');

      /**
       * Close event listener
       */
      this.resultsCloseEl.addEventListener('click', this.closeResults.bind(this));

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          this.closeResults();
        }
      });
    });
  }
  
  get storageName() {
    return 'product_compare';
  }

  get products() {
    return this._products;
  }

  set products(arr) {
    this._products = arr;
    this.querySelectorAll('[data-count]').forEach((count) => {
      count.textContent = `(${arr.length})`;
    });
    document.querySelectorAll('[data-header-count]').forEach((count) => {
      count.textContent = `${arr.length}`;
    });
    localStorage.setItem(this.storageName, JSON.stringify(arr));
  }
}

customElements.define('product-compare', ProductCompare);
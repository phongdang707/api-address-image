(function() {
  
    const loadScript = function(url, callback) {
      var script = document.createElement("script");
      script.type = "text/javascript";
  
      if (script.readyState) {
        //IE 
        script.onreadystatechange = function() {
          if (script.readyState == "loaded" || script.readyState == "complete") {
            script.onreadystatechange = null;
            callback();
          }
        };
      } else {
        //Others
        script.onload = function() {
          callback();
        };
      }
  
      script.src = url;
      document.getElementsByTagName("head")[0].appendChild(script);
    };
  
    window.bcWishListJS = function($) {
      let addClassList = bc_wl_cp_config.wishlist_add_class;
      let showClassList = bc_wl_cp_config.wishlist_show_class;
      let customerTags = [];
      const addClass = addClassList.split(/\s+/g).join(',');
      const showClass = showClassList.split(/\s+/g).join(',');
      const deleteClass = '.remove-wishlist';
      let maxAllow = Number(bc_wl_cp_config.number_product_wishlist);
      let trackAmount = 0;
      const appUrl = `https://arena-wishlist.ngrok.io`;
  
      return {
        init: function() {
          this.loadWishList();
          this.handleEvent();
        },
        //== Function to check valid amount
        checkValidAmount: function(done) {
          let exceedFlag = false;
          let deleteIndex = [];
          // Trim the tag
          customerTags = customerTags.map( (tag, index) => {
            tag = tag.trim();
            if (tag.search(/bc_wishlist__/g) != -1) {
              trackAmount += 1;
              if (trackAmount > maxAllow) {
                exceedFlag = true;  
                deleteIndex.push(index);
              }
            }
            return tag;
          } );
          if (exceedFlag) {
            alert(`Because wishlist configuration at backend only allow ${maxAllow} product added to wishlist. We will auto remove products that exceed our setting!`);
            
            for (i = deleteIndex.length - 1; i >= 0; i--) {
              customerTags.splice(deleteIndex[i], 1);
              trackAmount--;
            }
            $.ajax({
              url: `${appUrl}/frontend/add-wishlist?shop=${Shopify.shop}&themeId=${Shopify.theme.id}`,
              method: 'post',
              dataType: 'json',
              data: {
                customerId: customerLogged,
                customerTags: customerTags.join(','),
              },
              success: function(data) {
                done(null);
              },
              error: function(err) {
                done(err);  
              }
            })
          } else {
            done(null);
          }
        },
        //== Function to update wishlist icon
        updateIcon: function(){
          
          $(addClass).each((index, item) => {
            let handle = `bc_wishlist__${$(item).data('handle-product')}`;
            if (customerTags.indexOf(handle) != -1) {
              $(item).addClass('added');
            }
          })
        },
        //== Function to update number status
        updateAmount: function(){
          $(showClass).find('.number').text(trackAmount);  
          // Case no wishlist item
          if ($('.wishlist-table').length) {
            if (!trackAmount) {
              $('.wishlist-table').hide();
              $('.page-wishlist .no-wishlist-msg').show();  
            } else {
              $('.page-wishlist .no-wishlist-msg').hide();  
              $('.wishlist-table').show();  
            }  
          }
        },
        //== Function to load customer wishlist
        loadWishList: function() {
          
          const _this = this;
          /* Add Loading to all button */
          $(addClass).addClass('pending');
          /* Load User Wishlist Tags */
          if (customerLogged) {
            $.ajax({
              url: `${appUrl}/frontend/get-wishlist?shop=${Shopify.shop}&themeId=${Shopify.theme.id}`,
              method: 'post',
              dataType: 'json',
              data: {
                customerId: customerLogged,
              },
              success: function(data) {
                if (data.result != 'error') {
                  customerTags = data.resp;
                  
                  _this.checkValidAmount(function(err){
                    console.log(err);
                    $(addClass).removeClass('pending');
                    if (err) {
                      alert(err);
                    } else {
                      _this.updateIcon();
                      _this.updateAmount();
                    }
                  });
  
                  // Check if on wishlist page
                  if ($('.wishlist-table').length) {
                    $('.wishlist-table').removeClass('pending');
                  }
                   
                } else {
                  $(addClass).removeClass('pending');
                  alert(`There is an error when getting wishlist`);  
                }
              },
              error: function(err) {
                alert(`There is an error when getting wishlist`);  
                $(addClass).removeClass('pending');
              }
            })  
          } else {
            $(addClass).removeClass('pending');  
          }
        },
        //== Function to add event handler
        handleEvent() {
          const _this = this;
          $(addClass).on('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            _this.addToList(e.currentTarget);
          });
  
          $(deleteClass).on('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            _this.removeFromList(e.currentTarget);
          })
  
          $(showClass).on('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            _this.showLayout();  
          })  
        },
        //== Function handle remove product from wishlist
        removeFromList(target) {
          
          const _this = this;
          // Add loading class
          $(target).addClass('pending');
          // Remove product handle from list
          const prodHandle = $(target).data('handle-product');
          const handleIndex = customerTags.indexOf(`bc_wishlist__${prodHandle}`);
          const rowItem = $(target).parents('.wishlist-item');
  
          if (handleIndex > -1) {
            trackAmount--;
            customerTags.splice(handleIndex, 1);
            // Delete user tag
            $.ajax({
              url: `${appUrl}/frontend/add-wishlist?shop=${Shopify.shop}&themeId=${Shopify.theme.id}`,
              method: 'post',
              dataType: 'json',
              data: {
                customerId: customerLogged,
                customerTags: customerTags.join(','),
              },
              success: function(data) {
                if (data.result != 'error') {
                  $(target).removeClass('pending').addClass('added');
                  // Remove table row
                  rowItem.remove();
                } else {
                  trackAmount++;
                  $(target).removeClass('pending');
                  alert(`There is an error when deleting product to wishlist`);  
                }
                _this.updateAmount();
              },
              error: function(err) {
                trackAmount++;
                alert(`There is an error when deleting product to wishlist`);  
                $(target).removeClass('pending');
                _this.updateAmount();
              }
            })
          }
          
        },
        //== Function handle add to wishlist
        addToList(target) {
          const _this = this;
          const loginFlag = this.checkLogin(); 
          // User hasn't logged in yet
          if (!loginFlag) {
            alert(`Please login first to use wishlist function`);
            return;
          }
  
          // Product has already been added to wishlist
          if ($(target).hasClass('added')) {
            alert(`This product has already been added to wishlist`)
            return;
          }
  
          trackAmount++;
          if (trackAmount > maxAllow) {
            trackAmount = maxAllow;
            alert(`Only ${maxAllow} products allowed to add to wishlist`);
            return;
          }
          // Add loading class
          $(target).addClass('pending');
          // Add product handle to list
          const prodHandle = $(target).data('handle-product');
          customerTags.push(`bc_wishlist__${prodHandle}`);
          // Create user tag
          $.ajax({
            url: `${appUrl}/frontend/add-wishlist?shop=${Shopify.shop}&themeId=${Shopify.theme.id}`,
            method: 'post',
            dataType: 'json',
            data: {
              customerId: customerLogged,
              customerTags: customerTags.join(','),
            },
            success: function(data) {
              if (data.result != 'error') {
                $(target).removeClass('pending').addClass('added');
              } else {
                trackAmount--;
                $(target).removeClass('pending');
                alert(`There is an error when adding product to wishlist`);  
              }
              _this.updateAmount();
            },
            error: function(err) {
              trackAmount--;
              alert(`There is an error when adding product to wishlist`);  
              $(target).removeClass('pending');
              _this.updateAmount();
            }
          })
        },
        //== Function redirect to wishlist page
        showLayout() {
          window.location = '/apps/wishlist';
        },
        //== Function to check user login
        checkLogin() {
          return (customerLogged != '') ? true : false;  
        }
      };
    };
  
    window.bcCompareJS = function($) {
      let addClassList = bc_wl_cp_config.compare_add_class;
      let showClassList = bc_wl_cp_config.compare_show_class;
      const addClass = addClassList.split(/\s+/g).join(',');
      const showClass = showClassList.split(/\s+/g).join(',');
      const deleteClass = '.compare_remove';
      let maxAllow = Number(bc_wl_cp_config.number_product_compare);
      let layoutType = bc_wl_cp_config.compare_layout_type;
      let trackAmount = 0;
      let compareList = [];
      const appUrl = `https://arena-wishlist.ngrok.io`;
  
      return {
        //== Entry of functions
        init: function() {
          this.loadState();
          this.handleEvent();
        },
  
        //== Function to load compare list
        loadState: function() {
          const _this = this;
          let compareListStr = sessionStorage.getItem('bc_compare_products');
          /* Add Loading to all button */
          $(addClass).addClass('pending');
          
          if (compareListStr) {
            compareList = compareListStr.split(',');
  
            $(addClass).removeClass('pending');
            if (compareList) {
              _this.checkValidAmount(function(err) {  
                if (err) {
                  alert(err)
                } else {
                  _this.updateIcon();
                  _this.updateAmount();
                }
              })
  
              // Check if on compare page
              if ($('.compare-table').length) {
                _this.loadLayout(layoutType) ;
              }
               
            } 
          } else {
            $(addClass).removeClass('pending');  
            _this.updateAmount();
          }  
          
        },
  
        //== Function to check valid amount
        checkValidAmount(done) {
  
          if (compareList.length > maxAllow) {
            trackAmount = maxAllow;
            alert(`Because compare configuration at backend only allow ${maxAllow} product added to compare. We will auto remove products that exceed our setting!`);
            for (i = 0; i < compareList.length - maxAllow; i++) {
              compareList.pop();
            }
            sessionStorage.setItem('bc_compare_products', compareList);
            done(null)
          } else {
            trackAmount = compareList.length;
            done(null);
          }
        },
  
        //== Function to update Icons list
        updateIcon(){
          $(addClass).each((index, item) => {
            let handle = $(item).data('handle-product');
            if (compareList.indexOf(handle) != -1) {
              $(item).addClass('added');
            } else {
              $(item).removeClass('added');  
            }
          })
        },
  
        //== Add event handles
        handleEvent: function() {
          const _this = this;
          
          $(addClass).on('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            _this.addToList(e.currentTarget);
          });
  
          $(document).on('click', deleteClass, (e) => {
            
            
            e.stopPropagation();
            e.preventDefault();
            _this.removeFromList(e.target);
          })
  
          $(showClass).on('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            _this.showLayout();  
          })
        },
  
        removeFromList(target) {
          let removeBtn = $(target).hasClass('compare_remove') ? $(target) : $(target).parents('.compare_remove');
          const prodHandle = removeBtn.data('handle-product');
          const handleIndex = compareList.indexOf(prodHandle);
          const rowItem = $(target).parents('.wishlist-item');
          const _this = this;
          
          if (handleIndex > -1) {
            trackAmount--;
            compareList.splice(handleIndex, 1);  
            sessionStorage.setItem('bc_compare_products', compareList);
            $('.product_comparison_template tr').each((index, item) => {
              $($(item).find('.product-col')[handleIndex]).remove();
            })
            _this.updateIcon();
            _this.updateAmount();
            if (trackAmount == 0) {
              $.fancybox.close();  
            }
          }
        },
  
        //== Function handle add to compare
        addToList(target) {
          const _this = this;
          // Product has already been added to wishlist
          if ($(target).hasClass('added')) {
            alert(`This product has already been added to compare`)
            return;
          }
          
          trackAmount++;
          if (trackAmount > maxAllow) {
            trackAmount = maxAllow;
            alert(`Only ${maxAllow} products allowed to add to compare`);
            return;
          }
          
          // Add loading class
          $(target).addClass('pending');
          // Add product handle to list
          const prodHandle = $(target).data('handle-product');
          compareList.push(prodHandle);
          
          sessionStorage.setItem('bc_compare_products', compareList);
          
          $(target).removeClass('pending').addClass('added');
          _this.updateAmount();
        },
  
        //== Function to update number status
        updateAmount(){
          $(showClass).find('.number').text(trackAmount);
          // Case no wishlist item
          if ($('.page-compare').length) {
            if (!trackAmount) {
              $('.compare-table').hide();
              $('.page-compare .no-compare-msg').show();  
            } else {
              $('.page-compare .no-compare-msg').hide();  
              $('.compare-table').show();  
            }  
          }
        },
  
        //== Function to load compare layout
        loadLayout(type) {
          let prodData = [];
          let countDown = compareList.length;
          // Add loading icon
          if (type == 'popup') {
            $('#page-body').addClass('pending');  
          } 
  
          compareList.map( (prod, index) => {
            $.ajax({
              url: `/products/${prod}?view=compare`,
              method: 'get',
              dataType: 'html',
              success: function(data){
                const prod = JSON.parse(data);
                prodData.push(prod);
                countDown--;
                if (!countDown) {
                  
                  // send prodData to server
                  $.ajax({
                    url: `${appUrl}/frontend/get-compare-layout?shop=${Shopify.shop}&themeId=${Shopify.theme.id}`,
                    method: 'post',
                    dataType: 'json',
                    data: {
                      prodlist: JSON.stringify(prodData),
                      compare_translate: JSON.stringify(bc_wl_cp_config.compare_translate),
                      compare_showing_options: JSON.stringify(bc_wl_cp_config.compare_showing_option),
                    },
                    success: function(data) {
                      $('#page-body').removeClass('pending');
                      if (data.result != 'error') {
                        if (type == 'popup') {
                          $.fancybox.open(
                              data.resp, {
                                'autoDimensions': false,
                                'height': 600,
                                'width': 1170,
                                'autoSize'   : false,
                                'animationEffect' : 'fade',
                                'afterShow': function(){
                                  currenciesCallback();     
                                }
                            })
                        } else {
                          $('.compare-table').removeClass('pending').html(data.resp)  
                        }
                      } else {
                        alert('There is an error when getting compare list');
                      }
                    },
                    error: function(err) {
                      console.log(err);
                    }
                  })
                }
              },
              error: function(err) {
                console.log(err);
              }
            })  
          } )
        },
  
        //== Function to show compare layout
        showLayout: function(){
          const _this = this;
  
          if (compareList.length == 0) {
            alert(`You have no products to compare`);
            return;
          }
  
          if (layoutType == 'popup') {
            // If type is popup call load layout
            _this.loadLayout(layoutType)
          } else {
            // Redirect to compare page
            window.location = '/pages/compare';  
          }
        },
      }
    };
  
    let jqVer = String(parseFloat(jQuery.fn.jquery)).replace(/\./g, "");
    if (typeof jQuery === "undefined" || Number(jqVer) < 1.9) {
      loadScript("//code.jquery.com/jquery-2.2.4.min.js", function() {
        jQuery224 = jQuery.noConflict(true);
        bcWishListJS(jQuery224).init();
        bcCompareJS(jQuery224).init();
      });
    } else {
      bcWishListJS(jQuery).init();
      bcCompareJS(jQuery).init();
    }
  })();
  
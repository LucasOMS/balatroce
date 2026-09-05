-- src/lua/endpoints/cash_out.lua

-- ==========================================================================
-- CashOut Endpoint Params
-- ==========================================================================

---@class Request.Endpoint.CashOut.Params

-- ==========================================================================
-- CashOut Endpoint
-- ==========================================================================

---@type Endpoint
return {

  name = "cash_out",

  description = "Cash out and collect round rewards",

  schema = {},

  requires_state = { G.STATES.ROUND_EVAL },

  ---@param _ Request.Endpoint.CashOut.Params
  ---@param send_response fun(response: Response.Endpoint)
  execute = function(_, send_response)
    sendDebugMessage("Init cash_out()", "BB.ENDPOINTS")

    local num_items = function(area)
      local count = 0
      if area and area.cards then
        for _, v in ipairs(area.cards) do
          if v.children.buy_button and v.children.buy_button.definition then
            count = count + 1
          end
        end
      end
      return count
    end

    local function has_cash_out_button()
      for _, b in ipairs(G.I.UIBOX) do
        if b:get_UIE_by_ID("cash_out_button") then
          return true
        end
      end
      return false
    end

    -- NOTE: G.STATE flips to G.STATES.ROUND_EVAL a bit before G.round_eval
    -- exists and before evaluate_round() has finished queuing all the reward
    -- rows (blind/hands/discards/jokers/tags/interest) onto it. Calling
    -- G.FUNCS.cash_out() during that window tears down the round eval screen
    -- while those still-queued events later try to add a row to
    -- G.round_eval, crashing with "attempt to index field 'round_eval' (a
    -- nil value)". Wait until the round eval screen (including its cash out
    -- button) is fully built - the same readiness check used by play() -
    -- before actually cashing out.
    G.E_MANAGER:add_event(Event({
      trigger = "condition",
      blocking = false,
      func = function()
        if G.STATE ~= G.STATES.ROUND_EVAL or not G.round_eval or not G.STATE_COMPLETE or G.CONTROLLER.locked then
          return false
        end

        if not has_cash_out_button() then
          return false
        end

        G.FUNCS.cash_out({ config = {} })

        -- Wait for SHOP state after state transition completes
        G.E_MANAGER:add_event(Event({
          trigger = "condition",
          blocking = false,
          func = function()
            local done = false
            if G.STATE == G.STATES.SHOP and G.STATE_COMPLETE then
              done = num_items(G.shop_booster) > 0 or num_items(G.shop_jokers) > 0 or num_items(G.shop_vouchers) > 0
              if done then
                sendDebugMessage("Return cash_out() - reached SHOP state", "BB.ENDPOINTS")
                send_response(BB_GAMESTATE.get_gamestate())
                return done
              end
            end
            return done
          end,
        }))

        return true
      end,
    }))
  end,
}
